import os
import json
import pickle
import torch
import numpy as np
import logging
import shutil
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

def load_model_and_scaler(model_path, scaler_path):
    """Load the trained model and scaler"""
    try:
        # Load model
        checkpoint = torch.load(model_path)
        input_size = checkpoint.get('input_size', 8)
        hidden_size = checkpoint.get('hidden_size', 64)
        output_size = checkpoint.get('output_size', 2)
        
        model = RoutePredictor(input_size, hidden_size, output_size)
        model.load_state_dict(checkpoint['model_state_dict'])
        model.eval()
        
        # Load scaler
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        
        logger.info(f"Model and scaler loaded successfully from {model_path} and {scaler_path}")
        return model, scaler
    
    except Exception as e:
        logger.error(f"Error loading model or scaler: {e}")
        return None, None

def load_graph_data(graph_path):
    """Load the graph data"""
    try:
        with open(graph_path, 'r') as f:
            graph_data = json.load(f)
        
        logger.info(f"Graph data loaded successfully from {graph_path}")
        return graph_data
    
    except Exception as e:
        logger.error(f"Error loading graph data: {e}")
        return None

def create_offline_cache(model_path, scaler_path, graph_path, sample_routes_path, output_dir):
    """Create offline cache for edge computing"""
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        # Copy model and scaler
        shutil.copy(model_path, os.path.join(output_dir, os.path.basename(model_path)))
        shutil.copy(scaler_path, os.path.join(output_dir, os.path.basename(scaler_path)))
        
        # Load and save graph data
        graph_data = load_graph_data(graph_path)
        if graph_data:
            with open(os.path.join(output_dir, 'graph_cache.json'), 'w') as f:
                json.dump(graph_data, f)
        
        # Load and save sample routes
        try:
            with open(sample_routes_path, 'r') as f:
                sample_routes = json.load(f)
            
            with open(os.path.join(output_dir, 'routes_cache.json'), 'w') as f:
                json.dump(sample_routes, f)
        except Exception as e:
            logger.warning(f"Error loading sample routes: {e}")
        
        # Create metadata file
        metadata = {
            'created_at': datetime.now().isoformat(),
            'model_file': os.path.basename(model_path),
            'scaler_file': os.path.basename(scaler_path),
            'graph_file': 'graph_cache.json',
            'routes_file': 'routes_cache.json',
            'features': [
                'origin_lat', 'origin_lng', 
                'destination_lat', 'destination_lng',
                'avoid_tolls', 'avoid_highways', 
                'avoid_floods', 'avoid_debris'
            ]
        }
        
        with open(os.path.join(output_dir, 'metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Offline cache created successfully in {output_dir}")
        return True
    
    except Exception as e:
        logger.error(f"Error creating offline cache: {e}")
        return False

def generate_sample_predictions(model, scaler, output_dir, num_samples=10):
    """Generate sample predictions for testing"""
    try:
        # Create sample inputs
        sample_inputs = []
        
        # Sample 1: Delhi to Mumbai, avoiding floods and debris
        sample_inputs.append([28.6139, 77.2090, 19.0760, 72.8777, 0, 0, 1, 1])
        
        # Sample 2: Chennai to Bangalore, avoiding tolls
        sample_inputs.append([13.0827, 80.2707, 12.9716, 77.5946, 1, 0, 0, 0])
        
        # Sample 3: Kolkata to Hyderabad, avoiding highways
        sample_inputs.append([22.5726, 88.3639, 17.3850, 78.4867, 0, 1, 0, 0])
        
        # Generate more random samples
        for _ in range(num_samples - 3):
            # Random coordinates in India
            origin_lat = np.random.uniform(8.0, 35.0)
            origin_lng = np.random.uniform(68.0, 97.0)
            dest_lat = np.random.uniform(8.0, 35.0)
            dest_lng = np.random.uniform(68.0, 97.0)
            
            # Random avoidance preferences
            avoid_tolls = np.random.choice([0, 1])
            avoid_highways = np.random.choice([0, 1])
            avoid_floods = np.random.choice([0, 1])
            avoid_debris = np.random.choice([0, 1])
            
            sample_inputs.append([
                origin_lat, origin_lng, dest_lat, dest_lng,
                avoid_tolls, avoid_highways, avoid_floods, avoid_debris
            ])
        
        # Convert to numpy array
        X_samples = np.array(sample_inputs)
        
        # Scale inputs
        X_scaled = scaler.transform(X_samples)
        
        # Convert to tensor
        X_tensor = torch.tensor(X_scaled, dtype=torch.float32)
        
        # Get predictions
        with torch.no_grad():
            predictions = model(X_tensor).numpy()
        
        # Create sample predictions file
        samples = []
        for i, (inp, pred) in enumerate(zip(sample_inputs, predictions)):
            samples.append({
                'id': i + 1,
                'input': {
                    'origin': {'lat': inp[0], 'lng': inp[1]},
                    'destination': {'lat': inp[2], 'lng': inp[3]},
                    'avoid': {
                        'tolls': bool(inp[4]),
                        'highways': bool(inp[5]),
                        'floods': bool(inp[6]),
                        'debris': bool(inp[7])
                    }
                },
                'prediction': {
                    'distance': float(pred[0]),
                    'safety': float(pred[1])
                }
            })
        
        # Save sample predictions
        with open(os.path.join(output_dir, 'sample_predictions.json'), 'w') as f:
            json.dump(samples, f, indent=2)
        
        logger.info(f"Generated {len(samples)} sample predictions")
        return samples
    
    except Exception as e:
        logger.error(f"Error generating sample predictions: {e}")
        return None

if __name__ == "__main__":
    # Paths - update these to match your actual directory structure
    model_path = "planner/data/route_predictor_model.pth"
    scaler_path = "planner/data/scaler.pkl"
    graph_path = "planner/data/graph.json"
    sample_routes_path = "planner/data/sample_routes.json"
    output_dir = "planner/data"  # Store cache files alongside original data
    
    # Load model and scaler
    model, scaler = load_model_and_scaler(model_path, scaler_path)
    
    if model is not None and scaler is not None:
        # Create offline cache
        success = create_offline_cache(
            model_path, scaler_path, graph_path, sample_routes_path, output_dir
        )
