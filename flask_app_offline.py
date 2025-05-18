import os
import pickle
import torch
import numpy as np
import json
import logging
import networkx as nx
import traceback
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
from geopy.distance import geodesic

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import your existing code
try:
    from planner.route_predictor import load_model
except ImportError:
    logger.warning("Could not import load_model from planner.route_predictor")
    # Define a fallback load_model function
    def load_model(model_path):
        """Load the trained model and scaler"""
        try:
            # Load model
            checkpoint = torch.load(model_path, map_location=torch.device('cpu'))
            
            # Create model instance
            model = RoutePredictor()
            model.load_state_dict(checkpoint['model_state_dict'])
            model.eval()
            
            # Load scaler
            scaler_path = model_path.replace('.pth', '.pkl')
            if not os.path.exists(scaler_path):
                scaler_path = os.path.join(os.path.dirname(model_path), 'scaler.pkl')
            
            with open(scaler_path, 'rb') as f:
                scaler = pickle.load(f)
            
            logger.info(f"Model and scaler loaded successfully from {model_path} and {scaler_path}")
            return model, scaler
        
        except Exception as e:
            logger.error(f"Error loading model or scaler: {e}")
            logger.error(traceback.format_exc())
            return None, None

# Define the RoutePredictor model class
class RoutePredictor(torch.nn.Module):
    """Route prediction model that incorporates obstacle features"""
    def __init__(self, input_size=8, hidden_size=64, output_size=2):
        super(RoutePredictor, self).__init__()
        self.model = torch.nn.Sequential(
            torch.nn.Linear(input_size, hidden_size),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.2),
            torch.nn.Linear(hidden_size, hidden_size),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.2),
            torch.nn.Linear(hidden_size, output_size)
        )
    
    def forward(self, x):
        return self.model(x)

# Flask application
app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for all routes

# Global variables for offline mode
OFFLINE_MODE = False
MODEL = None
SCALER = None
GRAPH = None
CACHED_ROUTES = {}

# Paths - Updated to match actual directory structure
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "planner", "route_predictor_model.pth")
SCALER_PATH = os.path.join(BASE_DIR,"planner", "scaler.pkl")
GRAPH_PATH = os.path.join(BASE_DIR, "planner","graph.json")
ROUTES_PATH = os.path.join(BASE_DIR,"planner", "routes_cache.json")

# Log the paths for debugging
logger.info(f"BASE_DIR: {BASE_DIR}")
logger.info(f"MODEL_PATH: {MODEL_PATH}")
logger.info(f"SCALER_PATH: {SCALER_PATH}")
logger.info(f"GRAPH_PATH: {GRAPH_PATH}")
logger.info(f"ROUTES_PATH: {ROUTES_PATH}")

def load_offline_resources():
    """Load model, scaler, and graph for offline mode"""
    global MODEL, SCALER, GRAPH, CACHED_ROUTES, OFFLINE_MODE
    
    try:
        logger.info(f"Loading model from {MODEL_PATH}")
        # Check if model file exists
        if not os.path.exists(MODEL_PATH):
            logger.error(f"Model file not found at {MODEL_PATH}")
            return False
            
        # Load model
        MODEL = RoutePredictor()
        checkpoint = torch.load(MODEL_PATH, map_location=torch.device('cpu'))
        MODEL.load_state_dict(checkpoint['model_state_dict'])
        MODEL.eval()
        
        logger.info(f"Loading scaler from {SCALER_PATH}")
        # Check if scaler file exists
        if not os.path.exists(SCALER_PATH):
            logger.error(f"Scaler file not found at {SCALER_PATH}")
            return False
            
        # Load scaler
        with open(SCALER_PATH, 'rb') as f:
            SCALER = pickle.load(f)
        
        # Load graph if available, but don't fail if not found
        if os.path.exists(GRAPH_PATH):
            logger.info(f"Loading graph from {GRAPH_PATH}")
            with open(GRAPH_PATH, 'r') as f:
                GRAPH = json.load(f)
        else:
            logger.warning(f"Graph file not found at {GRAPH_PATH}, continuing without graph")
            GRAPH = {}
        
        # Load cached routes if available
        if os.path.exists(ROUTES_PATH):
            logger.info(f"Loading cached routes from {ROUTES_PATH}")
            with open(ROUTES_PATH, 'r') as f:
                routes = json.load(f)
                for route in routes:
                    key = f"{route['origin']['lat']},{route['origin']['lng']}-{route['destination']['lat']},{route['destination']['lng']}"
                    CACHED_ROUTES[key] = route
        else:
            logger.warning(f"Routes cache file not found at {ROUTES_PATH}, continuing without cached routes")
        
        OFFLINE_MODE = True
        logger.info("Offline resources loaded successfully")
        return True
    
    except Exception as e:
        logger.error(f"Error loading offline resources: {e}")
        logger.error(traceback.format_exc())
        OFFLINE_MODE = False
        return False

def reset_to_online_mode():
    """Reset to online mode by clearing offline resources and reloading online model"""
    global MODEL, SCALER, GRAPH, CACHED_ROUTES, OFFLINE_MODE
    
    try:
        logger.info("Resetting to online mode")
        
        # Clear offline resources
        GRAPH = None
        CACHED_ROUTES = {}
        
        # Reload model using the online load_model function
        MODEL, SCALER = load_model(MODEL_PATH)
        
        OFFLINE_MODE = False
        logger.info("Reset to online mode successful")
        return True
    
    except Exception as e:
        logger.error(f"Error resetting to online mode: {e}")
        logger.error(traceback.format_exc())
        return False

def geocode_location_osm(location):
    """Use Nominatim to convert address to lat/lng."""
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": location,
            "format": "json",
            "limit": 1
        }
        response = requests.get(url, params=params, headers={"User-Agent": "resqmap-app"} )
        response.raise_for_status()
        results = response.json()
        
        if not results:
            logger.warning(f"Location '{location}' not found.")
            return 0.0, 0.0  # Return default coordinates if not found
        
        return float(results[0]["lat"]), float(results[0]["lon"])
    
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        return 0.0, 0.0  # Return default coordinates on error

def predict_route_offline(origin_coords, dest_coords, avoid_options):
    """Predict route using offline model"""
    global MODEL, SCALER
    
    try:
        # Check if we have a cached route
        key = f"{origin_coords[0]},{origin_coords[1]}-{dest_coords[0]},{dest_coords[1]}"
        if key in CACHED_ROUTES:
            cached_route = CACHED_ROUTES[key]
            # Check if avoidance options match
            if (cached_route.get('avoid', {}).get('tolls', False) == avoid_options.get('tolls', False) and
                cached_route.get('avoid', {}).get('highways', False) == avoid_options.get('highways', False) and
                cached_route.get('avoid', {}).get('floods', True) == avoid_options.get('floods', True) and
                cached_route.get('avoid', {}).get('debris', True) == avoid_options.get('debris', True)):
                
                logger.info("Using cached route")
                return cached_route.get('path', [])
        
        # Prepare input for model
        input_data = np.array([[
            origin_coords[0], origin_coords[1],
            dest_coords[0], dest_coords[1],
            int(avoid_options.get('tolls', False)),
            int(avoid_options.get('highways', False)),
            int(avoid_options.get('floods', True)),
            int(avoid_options.get('debris', True))
        ]])
        
        # Scale input
        scaled_input = SCALER.transform(input_data)
        
        # Convert to tensor
        input_tensor = torch.tensor(scaled_input, dtype=torch.float32)
        
        # Get prediction
        with torch.no_grad():
            output = MODEL(input_tensor)
            path_cost, path_safety = output[0].numpy()
        
        logger.info(f"Model prediction: path_cost={path_cost}, path_safety={path_safety}")
        
        # Generate a simple path for demonstration
        # In a real implementation, this would use the graph and A* search with the predicted weights
        path = [
            {'lat': origin_coords[0], 'lng': origin_coords[1], 'name': 'Origin'},
            {'lat': (origin_coords[0] + dest_coords[0]) / 2, 'lng': (origin_coords[1] + dest_coords[1]) / 2, 'name': 'Midpoint'},
            {'lat': dest_coords[0], 'lng': dest_coords[1], 'name': 'Destination'}
        ]
        
        return path
    
    except Exception as e:
        logger.error(f"Error in offline route prediction: {e}")
        logger.error(traceback.format_exc())
        # Return direct path as fallback
        return [
            {'lat': origin_coords[0], 'lng': origin_coords[1], 'name': 'Origin'},
            {'lat': dest_coords[0], 'lng': dest_coords[1], 'name': 'Destination'}
        ]

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "offline_mode": OFFLINE_MODE,
        "model_loaded": MODEL is not None,
        "cached_routes": len(CACHED_ROUTES) if CACHED_ROUTES else 0
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
        routing_mode = data.get('mode', 'ml')  # Default to ML mode
        travel_mode = data.get('travelMode', 'driving')
        avoid_options = data.get('avoid', {})
        
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
        
        # Use offline prediction if in offline mode
        if OFFLINE_MODE and routing_mode == 'ml':
            logger.info("Using offline ML prediction")
            path = predict_route_offline(origin_coords, dest_coords, avoid_options)
            
            # Calculate distance
            distance = 0
            for i in range(len(path) - 1):
                distance += geodesic(
                    (path[i]['lat'], path[i]['lng']),
                    (path[i+1]['lat'], path[i+1]['lng'])
                ).kilometers * 1000  # Convert to meters
            
            # Estimate duration based on distance and travel mode
            speed_factor = {
                'driving': 50,  # km/h
                'cycling': 15,  # km/h
                'walking': 5    # km/h
            }.get(travel_mode, 50)
            
            duration = (distance / 1000) / speed_factor * 3600  # Convert to seconds
            
            return jsonify({
                "origin": {
                    "lat": origin_coords[0],
                    "lng": origin_coords[1]
                },
                "destination": {
                    "lat": dest_coords[0],
                    "lng": dest_coords[1]
                },
                "distance": distance,
                "duration": duration,
                "waypoints": path,
                "mode": "offline_ml"
            })
        
        # If not in offline mode or not using ML, use online routing service
        logger.info("Using online routing")
        
        # For demonstration, return a simple direct path
        path = [
            {'lat': origin_coords[0], 'lng': origin_coords[1], 'name': 'Origin'},
            {'lat': dest_coords[0], 'lng': dest_coords[1], 'name': 'Destination'}
        ]
        
        distance = geodesic(origin_coords, dest_coords).kilometers * 1000  # Convert to meters
        duration = (distance / 1000) / 50 * 3600  # Assuming 50 km/h average speed
        
        return jsonify({
            "origin": {
                "lat": origin_coords[0],
                "lng": origin_coords[1]
            },
            "destination": {
                "lat": dest_coords[0],
                "lng": dest_coords[1]
            },
            "distance": distance,
            "duration": duration,
            "waypoints": path,
            "mode": "online"
        })
    
    except Exception as e:
        logger.error(f"Routing error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/offline/toggle', methods=['POST'])
def toggle_offline_mode():
    """Toggle offline mode"""
    global OFFLINE_MODE
    
    try:
        data = request.json
        if data is None:
            return jsonify({
                "error": "Invalid JSON in request",
                "offline_mode": OFFLINE_MODE,
                "model_loaded": MODEL is not None,
                "cached_routes": len(CACHED_ROUTES) if CACHED_ROUTES else 0
            }), 400
            
        enable = data.get('enable', not OFFLINE_MODE)
        
        logger.info(f"Toggle offline mode request: enable={enable}, current={OFFLINE_MODE}")
        
        if enable and not OFFLINE_MODE:
            logger.info("Attempting to enable offline mode")
            success = load_offline_resources()
            if not success:
                logger.error("Failed to load offline resources")
                return jsonify({
                    "error": "Failed to load offline resources",
                    "offline_mode": OFFLINE_MODE,
                    "model_loaded": MODEL is not None,
                    "cached_routes": len(CACHED_ROUTES) if CACHED_ROUTES else 0
                }), 500
            logger.info("Offline mode enabled successfully")
        elif not enable and OFFLINE_MODE:
            logger.info("Attempting to disable offline mode")
            success = reset_to_online_mode()
            if not success:
                logger.error("Failed to reset to online mode")
                return jsonify({
                    "error": "Failed to reset to online mode",
                    "offline_mode": OFFLINE_MODE,
                    "model_loaded": MODEL is not None,
                    "cached_routes": len(CACHED_ROUTES) if CACHED_ROUTES else 0
                }), 500
            logger.info("Online mode enabled successfully")
        
        return jsonify({
            "offline_mode": OFFLINE_MODE,
            "model_loaded": MODEL is not None,
            "cached_routes": len(CACHED_ROUTES) if CACHED_ROUTES else 0
        })
    
    except Exception as e:
        logger.error(f"Error toggling offline mode: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "error": str(e),
            "offline_mode": OFFLINE_MODE,
            "model_loaded": MODEL is not None,
            "cached_routes": len(CACHED_ROUTES) if CACHED_ROUTES else 0
        }), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint to verify API is working"""
    return jsonify({
        "status": "ok",
        "offline_mode": OFFLINE_MODE,
        "model_loaded": MODEL is not None
    })

# Initialize offline mode on startup
if __name__ == "__main__":
    # Log the current directory and files for debugging
    logger.info(f"Current directory: {os.getcwd()}")
    logger.info(f"Files in current directory: {os.listdir('.')}")
    
    # Try to load offline resources
    load_offline_resources()
    
    # Start the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
