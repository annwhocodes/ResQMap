import os
import torch
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import logging
import networkx as nx
import json
import traceback
import math
import requests

# Import your existing code
from planner.graph_builder import build_graph, haversine_distance
from planner.astar import astar_search
from planner.route_predictor import load_model, predict_route

from maps.osrm_adapter import extract_route_from_osrm

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for all routes

# --------------------------
# Model and Data Loading
# --------------------------

# Model and data paths
model_path = os.path.join(os.path.dirname(__file__), "planner", "data", "route_predictor_model.pth")
earthquake_data_path = os.path.join(os.path.dirname(__file__), "planner", "data", "earthquake_events.csv")
tsunami_data_path = os.path.join(os.path.dirname(__file__), "planner", "data", "tsunami_events.csv")

# Load prediction model
model, scaler = load_model(model_path)

# Load historical data
try:
    earthquake_df = pd.read_csv(earthquake_data_path)
    tsunami_df = pd.read_csv(tsunami_data_path)
    logger.info("Datasets loaded successfully")
except Exception as e:
    logger.error(f"Error loading datasets: {e}")
    earthquake_df = pd.DataFrame()
    tsunami_df = pd.DataFrame()

# --------------------------
# Helper Functions
# --------------------------

def geocode_location_osm(location):
    """Use Nominatim to convert address to lat/lng."""
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": location,
            "format": "json",
            "limit": 1
        }
        response = requests.get(url, params=params, headers={"User-Agent": "resqmap-app"})
        response.raise_for_status()
        results = response.json()

        if not results:
            logger.warning(f"Location '{location}' not found.")
            return 0.0, 0.0  # Return default coordinates if not found
        
        return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        return 0.0, 0.0  # Return default coordinates on error

def fetch_osrm_route(origin_coords, destination_coords, profile="driving"):
    """Call OSRM API for routing with alternatives."""
    try:
        base_url = f"http://router.project-osrm.org/route/v1/{profile}"
        coords = f"{origin_coords[1]},{origin_coords[0]};{destination_coords[1]},{destination_coords[0]}"
        params = {
            "overview": "full",
            "geometries": "geojson",
            "steps": "true",
            "alternatives": "true"
        }
        response = requests.get(f"{base_url}/{coords}", params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"OSRM API error: {e}")
        # Return a minimal valid response structure
        return {
            "routes": [{
                "legs": [{
                    "steps": [],
                    "distance": haversine_distance(
                        origin_coords[0], origin_coords[1], 
                        destination_coords[0], destination_coords[1]
                    ) * 1000,  # Convert km to meters
                    "duration": 0
                }],
                "distance": haversine_distance(
                    origin_coords[0], origin_coords[1], 
                    destination_coords[0], destination_coords[1]
                ) * 1000,  # Convert km to meters
                "duration": 0,
                "geometry": {
                    "coordinates": [
                        [origin_coords[1], origin_coords[0]],
                        [destination_coords[1], destination_coords[0]]
                    ],
                    "type": "LineString"
                }
            }]
        }

def get_nearby_events(lat, lng, event_type, radius_km=100):
    """Get historical events near the specified location"""
    try:
        events_df = earthquake_df if event_type == 'earthquake' else tsunami_df
        
        if events_df.empty:
            return []
        
        events_df['distance'] = np.sqrt(
            (events_df['Latitude'] - lat) ** 2 + 
            (events_df['Longitude'] - lng) ** 2
        ) * 111  # Rough conversion to km
        
        nearby = events_df[events_df['distance'] <= radius_km].copy()
        nearby = nearby.sort_values('distance')
        
        result = []
        for _, row in nearby.iterrows():
            event = {
                "year": int(row['Year']) if not pd.isna(row['Year']) else None,
                "month": int(row['Mo']) if not pd.isna(row['Mo']) else None,
                "day": int(row['Dy']) if not pd.isna(row['Dy']) else None,
                "latitude": float(row['Latitude']) if not pd.isna(row['Latitude']) else None,
                "longitude": float(row['Longitude']) if not pd.isna(row['Longitude']) else None,
                "deaths": int(row['Deaths']) if not pd.isna(row['Deaths']) else None,
                "distance_km": float(row['distance']) if not pd.isna(row['distance']) else None
            }
            result.append(event)
        
        return result
    except Exception as e:
        logger.error(f"Error getting nearby events: {e}")
        return []  # Return empty list on error

# --------------------------
# API Endpoints
# --------------------------

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "model_loaded": model is not None,
        "data_loaded": not earthquake_df.empty
    })

@app.route('/api/geocode', methods=['GET'])
def geocode():
    try:
        location = request.args.get('location')
        if not location:
            return jsonify({"error": "Missing location parameter"}), 400
        
        lat, lon = geocode_location_osm(location)
        return jsonify({
            "location": location,
            "lat": lat,
            "lng": lon
        })
    except Exception as e:
        logger.error(f"Geocode error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/route', methods=['POST'])
def get_route():
    try:
        data = request.json
        logger.info(f"Routing request: {data}")
        
        origin = data.get('origin')
        destination = data.get('destination')
        routing_mode = data.get('mode', 'astar')
        travel_mode = data.get('travelMode', 'driving')
        
        if not origin or not destination:
            return jsonify({"error": "Missing origin or destination"}), 400

        # Handle both string locations and coordinate objects
        if isinstance(origin, str):
            origin_coords = geocode_location_osm(origin)
        else:
            origin_coords = (origin.get('lat', 0), origin.get('lng', 0))
            
        if isinstance(destination, str):
            dest_coords = geocode_location_osm(destination)
        else:
            dest_coords = (destination.get('lat', 0), destination.get('lng', 0))

        # Validate coordinates
        if origin_coords[0] == 0 and origin_coords[1] == 0:
            return jsonify({"error": "Invalid origin coordinates"}), 400
            
        if dest_coords[0] == 0 and dest_coords[1] == 0:
            return jsonify({"error": "Invalid destination coordinates"}), 400

        # Get route from OSRM
        osrm_response = fetch_osrm_route(origin_coords, dest_coords, travel_mode)
        
        # Extract route data
        try:
            route_data = extract_route_from_osrm(osrm_response)
        except Exception as e:
            logger.error(f"Error extracting route: {e}")
            # Create minimal route data
            route_data = {
                'total_distance': haversine_distance(
                    origin_coords[0], origin_coords[1], 
                    dest_coords[0], dest_coords[1]
                ) * 1000,  # Convert km to meters
                'total_duration': 0,
                'waypoints': [
                    {'lat': origin_coords[0], 'lng': origin_coords[1], 'name': 'Origin'},
                    {'lat': dest_coords[0], 'lng': dest_coords[1], 'name': 'Destination'}
                ],
                'polyline': [
                    [origin_coords[1], origin_coords[0]],
                    [dest_coords[1], dest_coords[0]]
                ],
                'steps': []
            }
        
        # Build graph from route data
        G = build_graph(route_data)
        
        # Find closest nodes to origin and destination
        def find_closest_node(target_lat, lng):
            return min(G.nodes, key=lambda n: haversine_distance(
                target_lat, lng, G.nodes[n]['lat'], G.nodes[n]['lng']
            ))
        
        origin_node = find_closest_node(*origin_coords)
        dest_node = find_closest_node(*dest_coords)
        
        # Get path based on routing mode
        if routing_mode == 'ml' and model is not None:
            # Use ML-based route prediction
            path = predict_route(
                G, 
                origin_node, 
                dest_node,
                model=model,
                scaler=scaler,
                earthquake_data=earthquake_df,
                tsunami_data=tsunami_df
            )
        else:
            # Fallback to A* search
            path = astar_search(G, origin_node, dest_node)
        
        # Ensure path is not None (should be handled by the updated functions)
        if path is None:
            logger.warning("Path is None, using direct path")
            path = [origin_node, dest_node]
        
        # Create waypoints from path
        waypoints = [{
            "name": G.nodes[node].get('name', f"Point {node}"),
            "lat": G.nodes[node]['lat'],
            "lng": G.nodes[node]['lng'],
            "type": G.nodes[node].get('type', 'waypoint')
        } for node in path]

        return jsonify({
            "route": {
                "waypoints": waypoints,
                "distance": route_data['total_distance'],
                "duration": route_data['total_duration'],
                "polyline": route_data.get('polyline', []),
                "steps": route_data.get('steps', [])
            },
            "metadata": {
                "algorithm": routing_mode,
                "travelMode": travel_mode,
                "start_node": origin_node,
                "end_node": dest_node
            }
        })
        
    except Exception as e:
        logger.error(f"Routing error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict_route', methods=['POST'])
def predict_route_endpoint():
    if model is None or scaler is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        data = request.get_json()
        logger.info(f"Prediction request: {data}")
        
        start_lat = data.get('start_lat')
        start_lng = data.get('start_lng')
        end_lat = data.get('end_lat')
        end_lng = data.get('end_lng')
        event_type = data.get('event_type', 'earthquake')
        
        input_data = np.array([[start_lat, start_lng, end_lat, end_lng, 1.0 if event_type == 'earthquake' else 0.0]])
        scaled_input = torch.tensor(scaler.transform(input_data), dtype=torch.float32)
        
        with torch.no_grad():
            output = model(scaled_input)
            
        path_cost, path_safety = output[0].numpy()
        nearby_events = get_nearby_events(start_lat, start_lng, event_type)
        
        return jsonify({
            "prediction": {
                "path_cost": float(path_cost),
                "path_safety": float(path_safety)
            },
            "nearby_events": nearby_events
        })
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/events', methods=['GET'])
def get_events():
    event_type = request.args.get('type', 'earthquake')
    events_df = earthquake_df if event_type == 'earthquake' else tsunami_df
    
    if events_df.empty:
        return jsonify([])
    
    events = []
    for _, row in events_df.iterrows():
        if pd.isna(row['Latitude']) or pd.isna(row['Longitude']):
            continue
            
        event = {
            "year": int(row['Year']) if not pd.isna(row['Year']) else None,
            "month": int(row['Mo']) if not pd.isna(row['Mo']) else None,
            "day": int(row['Dy']) if not pd.isna(row['Dy']) else None,
            "latitude": float(row['Latitude']),
            "longitude": float(row['Longitude']),
            "deaths": int(row['Deaths']) if not pd.isna(row['Deaths']) else None
        }
        events.append(event)
    
    return jsonify(events)

@app.route('/api/offline/toggle', methods=['POST'])
def toggle_offline_mode():
    """Toggle offline mode"""
    global OFFLINE_MODE
    
    try:
        data = request.json
        if data is None:
            return jsonify({
                "offline_mode": OFFLINE_MODE
            })
            
        enable = data.get('enable', not OFFLINE_MODE)
        OFFLINE_MODE = enable
        
        return jsonify({
            "offline_mode": OFFLINE_MODE
        })
    
    except Exception as e:
        print(f"Error toggling offline mode: {str(e)}")
        return jsonify({
            "error": str(e),
            "offline_mode": OFFLINE_MODE
        }), 500

@app.route('/api/analyze_area', methods=['POST'])
def analyze_area():
    try:
        data = request.get_json()
        center_lat = data.get('lat')
        center_lng = data.get('lng')
        radius_km = data.get('radius', 50)
        
        earthquake_events = get_nearby_events(center_lat, center_lng, 'earthquake', radius_km)
        tsunami_events = get_nearby_events(center_lat, center_lng, 'tsunami', radius_km)
        
        earthquake_risk = min(len(earthquake_events) / 5, 1.0)
        tsunami_risk = min(len(tsunami_events) / 3, 1.0)
        overall_risk = (earthquake_risk * 0.7) + (tsunami_risk * 0.3)
        
        return jsonify({
            "earthquake_risk": earthquake_risk,
            "tsunami_risk": tsunami_risk,
            "overall_risk": overall_risk,
            "earthquake_events_count": len(earthquake_events),
            "tsunami_events_count": len(tsunami_events)
        })
    
    except Exception as e:
        logger.error(f"Area analysis error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)