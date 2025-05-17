from flask import Flask, request, jsonify
from flask_cors import CORS
import networkx as nx
import json
import traceback

# Import your existing code
from planner.graph_builder import build_graph
from planner.astar import astar_search
try:
    from planner.route_predictor import load_model, predict_route
except ImportError:
    # Mock implementation in case ML modules are not available
    def load_model(*args):
        return None, {}
    
    def predict_route(*args):
        return []

from visualisation.plot import plot_route
from maps.osrm_adapter import extract_route_from_osrm

import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --------------------------
# Helper Functions
# --------------------------

def geocode_location_osm(location):
    """Use Nominatim to convert address to lat/lng."""
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
        raise ValueError(f"Location '{location}' not found.")
    
    lat = float(results[0]["lat"])
    lon = float(results[0]["lon"])
    return lat, lon

def fetch_osrm_route(origin_coords, destination_coords, profile="driving"):
    """Call OSRM API for routing."""
    base_url = f"http://router.project-osrm.org/route/v1/{profile}"
    coords = f"{origin_coords[1]},{origin_coords[0]};{destination_coords[1]},{destination_coords[0]}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "true"
    }
    response = requests.get(f"{base_url}/{coords}", params=params)
    response.raise_for_status()
    return response.json()

# --------------------------
# API Routes
# --------------------------

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({"status": "online"})

@app.route('/api/geocode', methods=['GET'])
def geocode():
    """Geocode location to lat/lng."""
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
        return jsonify({"error": str(e)}), 500

@app.route('/api/route', methods=['POST'])
def get_route():
    """Generate route using A* algorithm or ML model."""
    try:
        data = request.json
        
        # Extract parameters
        origin = data.get('origin')
        destination = data.get('destination')
        routing_mode = data.get('mode', 'astar')  # 'astar' or 'ml'
        travel_mode = data.get('travelMode', 'driving')
        avoid = data.get('avoid', [])
        
        # Validate input
        if not origin or not destination:
            return jsonify({"error": "Missing origin or destination"}), 400
        
        # Process origin and destination
        if isinstance(origin, str):
            origin_coords = geocode_location_osm(origin)
        else:
            origin_coords = (origin.get('lat'), origin.get('lng'))
            
        if isinstance(destination, str):
            dest_coords = geocode_location_osm(destination)
        else:
            dest_coords = (destination.get('lat'), destination.get('lng'))
            
        # Get route from OSRM
        osrm_response = fetch_osrm_route(origin_coords, dest_coords, profile=travel_mode)
        route_data = extract_route_from_osrm(osrm_response)
        
        # Build graph from route data
        G = build_graph(route_data)
        
        # Compute route based on selected mode
        if routing_mode == 'astar':
            path = astar_search(G, 0, len(G.nodes)-1)
        else:  # ML mode
            try:
                model, node_to_idx = load_model("route_model.pt")
                origin_idx = node_to_idx.get(0, 0)
                dest_idx = node_to_idx.get(len(G.nodes)-1, len(G.nodes)-1)
                path = predict_route(model, node_to_idx, origin_idx, dest_idx)
            except Exception as e:
                return jsonify({
                    "error": f"ML model error: {str(e)}",
                    "fallback": "Using A* algorithm instead"
                }), 500
                path = astar_search(G, 0, len(G.nodes)-1)
        
        # If no path found, return error
        if not path:
            return jsonify({"error": "No route could be found"}), 404
            
        # Extract waypoints from path
        waypoints = []
        for node in path:
            node_data = G.nodes[node]
            waypoints.append({
                "name": node_data.get('name', f"Point {node}"),
                "lat": node_data.get('lat'),
                "lng": node_data.get('lng'),
                "type": node_data.get('type', 'waypoint')
            })
            
        # Prepare response
        response = {
            "route": {
                "waypoints": waypoints,
                "distance": route_data['total_distance'],
                "duration": route_data['total_duration'],
                "polyline": route_data.get('polyline', ''),
                "steps": route_data.get('steps', [])
            },
            "metadata": {
                "algorithm": routing_mode,
                "travelMode": travel_mode,
                "avoid": avoid
            }
        }
            
        return jsonify(response)
        
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/hazards', methods=['GET'])
def get_hazards():
    """Get all reported hazards."""
    # This would normally come from a database
    # For now, return mock data
    mock_hazards = [
        {
            "id": "h1",
            "type": "flood",
            "severity": "high",
            "lat": 19.072,
            "lng": 72.877,
            "description": "Road flooded, impassable",
            "timestamp": "2025-05-16T08:30:00Z"
        },
        {
            "id": "h2",
            "type": "debris",
            "severity": "medium",
            "lat": 18.551,
            "lng": 73.855,
            "description": "Fallen trees blocking partial road",
            "timestamp": "2025-05-16T10:15:00Z"
        }
    ]
    return jsonify(mock_hazards)

@app.route('/api/hazards', methods=['POST'])
def report_hazard():
    """Report a new hazard."""
    try:
        hazard = request.json
        # This would normally save to a database
        # For now, just echo it back with a mock ID
        hazard["id"] = "h" + str(hash(hazard.get("description", "") + str(hazard.get("lat", 0))))[:6]
        return jsonify(hazard)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)