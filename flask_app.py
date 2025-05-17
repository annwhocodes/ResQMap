from flask import Flask, request, jsonify
from flask_cors import CORS
import networkx as nx
import json
import traceback
import math

# Import your existing code
from planner.graph_builder import build_graph, haversine_distance
from planner.astar import astar_search
try:
    from planner.route_predictor import load_model, predict_route
except ImportError:
    def load_model(*args): return None, {}
    def predict_route(*args): return []

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
    
    return float(results[0]["lat"]), float(results[0]["lon"])

def fetch_osrm_route(origin_coords, destination_coords, profile="driving"):
    """Call OSRM API for routing with alternatives."""
    base_url = f"http://router.project-osrm.org/route/v1/{profile}"
    coords = f"{origin_coords[1]},{origin_coords[0]};{destination_coords[1]},{destination_coords[0]}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "true",
        "alternatives": "true"  # Critical for multiple routes
    }
    response = requests.get(f"{base_url}/{coords}", params=params)
    response.raise_for_status()
    return response.json()

# --------------------------
# API Routes
# --------------------------

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online"})

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
        return jsonify({"error": str(e)}), 500

@app.route('/api/route', methods=['POST'])
def get_route():
    try:
        data = request.json
        print("\n[DEBUG] /api/route called")
        print("[DEBUG] Incoming data:", data)
        
        # Extract parameters
        origin = data.get('origin')
        destination = data.get('destination')
        routing_mode = data.get('mode', 'astar')
        travel_mode = data.get('travelMode', 'driving')
        
        # Validate and process coordinates
        if not origin or not destination:
            return jsonify({"error": "Missing origin or destination"}), 400

        origin_coords = geocode_location_osm(origin) if isinstance(origin, str) else \
            (origin.get('lat'), origin.get('lng'))
        dest_coords = geocode_location_osm(destination) if isinstance(destination, str) else \
            (destination.get('lat'), destination.get('lng'))

        print(f"[DEBUG] Origin Coordinates: {origin_coords}")
        print(f"[DEBUG] Destination Coordinates: {dest_coords}")

        # Get OSRM data
        osrm_response = fetch_osrm_route(origin_coords, dest_coords, travel_mode)
        route_data = extract_route_from_osrm(osrm_response)
        
        # Build graph
        G = build_graph(route_data)
        
        # Find closest nodes
        def find_closest_node(target_lat, lng):
            return min(G.nodes, key=lambda n: haversine_distance(
                target_lat, lng, G.nodes[n]['lat'], G.nodes[n]['lng']
            ))
        
        origin_node = find_closest_node(*origin_coords)
        dest_node = find_closest_node(*dest_coords)

        print(f"[DEBUG] Closest Origin Node: {origin_node}")
        print(f"[DEBUG] Closest Destination Node: {dest_node}")
        
        # Calculate path
        path = astar_search(G, origin_node, dest_node)
        print(f"[DEBUG] Computed Path: {path}")
        
        # Prepare response
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
        print("[ERROR] Exception in /api/route:")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/api/hazards', methods=['GET'])
def get_hazards():
    mock_hazards = [
        {
            "id": "h1",
            "type": "flood",
            "lat": 19.072,
            "lng": 72.877,
            "description": "Road flooded, impassable"
        }
    ]
    return jsonify(mock_hazards)

if __name__ == '__main__':
    app.run(debug=True, port=5000)