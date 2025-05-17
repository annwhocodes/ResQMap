import torch
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)

def load_model(model_path):
    """
    Load the route prediction model from a file.
    
    Args:
        model_path (str): Path to the model file
        
    Returns:
        tuple: (model, scaler) or (None, None) if loading fails
    """
    try:
        logger.info(f"Loading model from {model_path}")
        checkpoint = torch.load(model_path, map_location=torch.device('cpu'))
        
        class RoutePredictor(torch.nn.Module):
            def __init__(self, input_size=5, hidden_size=64, output_size=2):
                super(RoutePredictor, self).__init__()
                self.model = torch.nn.Sequential(
                    torch.nn.Linear(input_size, hidden_size),
                    torch.nn.ReLU(),
                    torch.nn.Linear(hidden_size, hidden_size),
                    torch.nn.ReLU(),
                    torch.nn.Linear(hidden_size, output_size)
                )
            
            def forward(self, x):
                return self.model(x)
        
        model = RoutePredictor()
        model.load_state_dict(checkpoint['model_state_dict'])
        model.eval()
        
        scaler = checkpoint.get('scaler')
        logger.info("Model and scaler loaded successfully")
        return model, scaler
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return None, None

def predict_route(G, origin_node, dest_node, model=None, scaler=None, earthquake_data=None, tsunami_data=None):
    """
    Predict the optimal route using ML model or fallback to A* search.
    
    Args:
        G (networkx.Graph): The graph representing the road network
        origin_node: The starting node
        dest_node: The destination node
        model: The ML model for route prediction
        scaler: The scaler for normalizing input data
        earthquake_data: DataFrame containing earthquake data
        tsunami_data: DataFrame containing tsunami data
        
    Returns:
        list: A list of nodes representing the path from origin to destination
    """
    try:
        # If model or scaler is not available, fallback to A* search
        if model is None or scaler is None:
            logger.warning("Model or scaler not available, falling back to A* search")
            from .astar import astar_search
            path = astar_search(G, origin_node, dest_node)
            if path is None:
                logger.warning("A* search returned None, using direct path")
                return [origin_node, dest_node]  # Return direct path as fallback
            return path
        
        # Get coordinates for origin and destination
        origin_lat = G.nodes[origin_node].get('lat', 0)
        origin_lng = G.nodes[origin_node].get('lng', 0)
        dest_lat = G.nodes[dest_node].get('lat', 0)
        dest_lng = G.nodes[dest_node].get('lng', 0)
        
        # Check if we have valid coordinates
        if origin_lat == 0 or origin_lng == 0 or dest_lat == 0 or dest_lng == 0:
            logger.warning("Invalid coordinates, falling back to A* search")
            from .astar import astar_search
            path = astar_search(G, origin_node, dest_node)
            if path is None:
                logger.warning("A* search returned None, using direct path")
                return [origin_node, dest_node]  # Return direct path as fallback
            return path
        
        # Determine if area has more earthquakes or tsunamis
        event_type_value = 1.0  # Default to earthquake
        if earthquake_data is not None and tsunami_data is not None:
            # Simple heuristic: check which type of event is more common in the area
            earthquake_count = len(earthquake_data)
            tsunami_count = len(tsunami_data)
            event_type_value = 1.0 if earthquake_count >= tsunami_count else 0.0
        
        # Prepare input for model
        input_data = np.array([[origin_lat, origin_lng, dest_lat, dest_lng, event_type_value]])
        
        # Scale input
        try:
            scaled_input = torch.tensor(scaler.transform(input_data), dtype=torch.float32)
        except Exception as e:
            logger.error(f"Error scaling input: {e}")
            from .astar import astar_search
            path = astar_search(G, origin_node, dest_node)
            if path is None:
                logger.warning("A* search returned None, using direct path")
                return [origin_node, dest_node]  # Return direct path as fallback
            return path
        
        # Get model prediction
        try:
            with torch.no_grad():
                output = model(scaled_input)
            
            path_cost, path_safety = output[0].numpy()
            logger.info(f"Model prediction: path_cost={path_cost}, path_safety={path_safety}")
            
            # Use prediction to guide A* search
            from .astar import astar_search
            path = astar_search(G, origin_node, dest_node, weight='length', 
                               safety_weight=path_safety, cost_weight=path_cost)
            
            if path is None:
                logger.warning("A* search with ML weights returned None, using direct path")
                return [origin_node, dest_node]  # Return direct path as fallback
                
            return path
            
        except Exception as e:
            logger.error(f"Error during model prediction: {e}")
            from .astar import astar_search
            path = astar_search(G, origin_node, dest_node)
            if path is None:
                logger.warning("A* search returned None, using direct path")
                return [origin_node, dest_node]  # Return direct path as fallback
            return path
            
    except Exception as e:
        logger.error(f"Error in predict_route: {e}")
        # Always return at least a direct path
        return [origin_node, dest_node]
