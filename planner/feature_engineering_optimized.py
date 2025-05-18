import pandas as pd
import numpy as np
import os
import json
import logging
import networkx as nx
from sklearn.preprocessing import StandardScaler
import torch
import random
from geopy.distance import geodesic

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants for obstacle generation - OPTIMIZED for faster processing
TOLL_PROBABILITY = 0.1  # 10% of roads have tolls
HIGHWAY_PROBABILITY = 0.2  # 20% of roads are highways
FLOOD_RISK_RADIUS_KM = 50  # Radius around tsunami events with flood risk
DEBRIS_RISK_RADIUS_KM = 30  # Radius around earthquake events with debris risk

# OPTIMIZATION: Reduced grid size and number of routes
GRID_SIZE = 1.0  # Increased from 0.5 to 1.0 degree spacing
NUM_ROUTES = 200  # Reduced from 1000 to 200

def load_datasets(earthquake_path, tsunami_path):
    """Load earthquake and tsunami datasets"""
    try:
        earthquake_df = pd.read_csv(earthquake_path)
        tsunami_df = pd.read_csv(tsunami_path)
        logger.info(f"Loaded {len(earthquake_df)} earthquake events and {len(tsunami_df)} tsunami events")
        return earthquake_df, tsunami_df
    except Exception as e:
        logger.error(f"Error loading datasets: {e}")
        return pd.DataFrame(), pd.DataFrame()

def create_grid_graph(min_lat=6.0, max_lat=35.0, min_lng=68.0, max_lng=98.0, grid_size=GRID_SIZE):
    """Create a grid graph covering India with nodes at regular intervals"""
    G = nx.Graph()
    
    # Create nodes
    node_id = 0
    for lat in np.arange(min_lat, max_lat, grid_size):
        for lng in np.arange(min_lng, max_lng, grid_size):
            G.add_node(node_id, lat=lat, lng=lng)
            node_id += 1
    
    # Connect nodes to neighbors - OPTIMIZATION: Only connect to immediate neighbors
    for node in G.nodes():
        lat1, lng1 = G.nodes[node]['lat'], G.nodes[node]['lng']
        for other_node in G.nodes():
            if node != other_node:
                lat2, lng2 = G.nodes[other_node]['lat'], G.nodes[other_node]['lng']
                # Connect only to immediate neighbors (horizontally, vertically)
                if ((abs(lat1 - lat2) <= grid_size and abs(lng1 - lng2) < 0.001) or 
                    (abs(lng1 - lng2) <= grid_size and abs(lat1 - lat2) < 0.001)):
                    # Calculate distance in km
                    distance = geodesic((lat1, lng1), (lat2, lng2)).kilometers
                    G.add_edge(node, other_node, distance=distance)
    
    logger.info(f"Created grid graph with {len(G.nodes())} nodes and {len(G.edges())} edges")
    return G

def add_obstacle_features(G, earthquake_df, tsunami_df):
    """Add obstacle features to graph edges based on earthquake and tsunami data"""
    # Initialize edge attributes
    for u, v in G.edges():
        G[u][v]['toll'] = False
        G[u][v]['highway'] = False
        G[u][v]['flood_risk'] = 0.0
        G[u][v]['debris_risk'] = 0.0
    
    # Add tolls and highways randomly
    for u, v in G.edges():
        if random.random() < TOLL_PROBABILITY:
            G[u][v]['toll'] = True
        if random.random() < HIGHWAY_PROBABILITY:
            G[u][v]['highway'] = True
    
    # OPTIMIZATION: Process only a subset of tsunami events if there are many
    tsunami_sample = tsunami_df.sample(min(len(tsunami_df), 10)) if len(tsunami_df) > 10 else tsunami_df
    
    # Add flood risk based on tsunami events
    for _, event in tsunami_sample.iterrows():
        if pd.isna(event['Latitude']) or pd.isna(event['Longitude']):
            continue
            
        event_lat, event_lng = event['Latitude'], event['Longitude']
        
        # OPTIMIZATION: Pre-filter nodes that might be affected
        for u, v in G.edges():
            # Get midpoint of edge
            lat1, lng1 = G.nodes[u]['lat'], G.nodes[u]['lng']
            lat2, lng2 = G.nodes[v]['lat'], G.nodes[v]['lng']
            mid_lat, mid_lng = (lat1 + lat2) / 2, (lng1 + lng2) / 2
            
            # Quick distance check before calculating precise distance
            if (abs(mid_lat - event_lat) > 0.5 or abs(mid_lng - event_lng) > 0.5):
                continue
                
            # Calculate distance to event
            distance = geodesic((event_lat, event_lng), (mid_lat, mid_lng)).kilometers
            
            # Add flood risk based on proximity
            if distance <= FLOOD_RISK_RADIUS_KM:
                # Risk decreases with distance
                risk_factor = 1.0 - (distance / FLOOD_RISK_RADIUS_KM)
                G[u][v]['flood_risk'] = max(G[u][v]['flood_risk'], risk_factor)
    
    # OPTIMIZATION: Process only a subset of earthquake events if there are many
    earthquake_sample = earthquake_df.sample(min(len(earthquake_df), 20)) if len(earthquake_df) > 20 else earthquake_df
    
    # Add debris risk based on earthquake events
    for _, event in earthquake_sample.iterrows():
        if pd.isna(event['Latitude']) or pd.isna(event['Longitude']):
            continue
            
        event_lat, event_lng = event['Latitude'], event['Longitude']
        
        # OPTIMIZATION: Pre-filter nodes that might be affected
        for u, v in G.edges():
            # Get midpoint of edge
            lat1, lng1 = G.nodes[u]['lat'], G.nodes[u]['lng']
            lat2, lng2 = G.nodes[v]['lat'], G.nodes[v]['lng']
            mid_lat, mid_lng = (lat1 + lat2) / 2, (lng1 + lng2) / 2
            
            # Quick distance check before calculating precise distance
            if (abs(mid_lat - event_lat) > 0.5 or abs(mid_lng - event_lng) > 0.5):
                continue
                
            # Calculate distance to event
            distance = geodesic((event_lat, event_lng), (mid_lat, mid_lng)).kilometers
            
            # Add debris risk based on proximity
            if distance <= DEBRIS_RISK_RADIUS_KM:
                # Risk decreases with distance
                risk_factor = 1.0 - (distance / DEBRIS_RISK_RADIUS_KM)
                G[u][v]['debris_risk'] = max(G[u][v]['debris_risk'], risk_factor)
    
    logger.info("Added obstacle features to graph edges")
    return G

def generate_training_routes(G, num_routes=NUM_ROUTES):
    """Generate training routes with varying obstacle avoidance preferences"""
    routes = []
    nodes = list(G.nodes())
    
    for _ in range(num_routes):
        # Select random origin and destination
        origin = random.choice(nodes)
        destination = random.choice(nodes)
        
        # Skip if origin and destination are the same or too close
        if origin == destination:
            continue
            
        origin_lat, origin_lng = G.nodes[origin]['lat'], G.nodes[origin]['lng']
        dest_lat, dest_lng = G.nodes[destination]['lat'], G.nodes[destination]['lng']
        
        # Skip if distance is too short (less than 100km)
        if geodesic((origin_lat, origin_lng), (dest_lat, dest_lng)).kilometers < 100:
            continue
        
        # Generate random avoidance preferences
        avoid_tolls = random.choice([True, False])
        avoid_highways = random.choice([True, False])
        avoid_floods = random.choice([True, False])
        avoid_debris = random.choice([True, False])
        
        # Create edge weight function based on avoidance preferences
        def weight_function(u, v, data):
            base_weight = data['distance']
            
            # Add penalties based on avoidance preferences
            if avoid_tolls and data['toll']:
                base_weight *= 5.0  # 5x penalty for tolls if avoiding
            
            if avoid_highways and data['highway']:
                base_weight *= 2.0  # 2x penalty for highways if avoiding
            
            if avoid_floods:
                base_weight *= (1.0 + 10.0 * data['flood_risk'])  # Up to 10x penalty for flood risk
            
            if avoid_debris:
                base_weight *= (1.0 + 10.0 * data['debris_risk'])  # Up to 10x penalty for debris risk
            
            return base_weight
        
        # Find shortest path using custom weight function
        try:
            path = nx.shortest_path(G, origin, destination, weight=weight_function)
            
            # Calculate path metrics
            path_distance = 0.0
            path_safety = 0.0
            
            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                path_distance += G[u][v]['distance']
                
                # Safety score is inverse of combined risk
                combined_risk = G[u][v]['flood_risk'] + G[u][v]['debris_risk']
                edge_safety = 1.0 - min(combined_risk, 1.0)
                path_safety += edge_safety
            
            # Normalize path safety
            if len(path) > 1:
                path_safety /= (len(path) - 1)
            
            # Create route data
            route = {
                'origin': {
                    'lat': G.nodes[origin]['lat'],
                    'lng': G.nodes[origin]['lng']
                },
                'destination': {
                    'lat': G.nodes[destination]['lat'],
                    'lng': G.nodes[destination]['lng']
                },
                'avoid': {
                    'tolls': avoid_tolls,
                    'highways': avoid_highways,
                    'floods': avoid_floods,
                    'debris': avoid_debris
                },
                'path': [{'lat': G.nodes[n]['lat'], 'lng': G.nodes[n]['lng']} for n in path],
                'distance': path_distance,
                'safety': path_safety
            }
            
            routes.append(route)
            
        except nx.NetworkXNoPath:
            # Skip if no path exists
            continue
    
    logger.info(f"Generated {len(routes)} training routes")
    return routes

def create_feature_vectors(routes):
    """Create feature vectors and labels for model training"""
    features = []
    labels = []
    
    for route in routes:
        # Features: origin coords, destination coords, avoidance preferences
        feature_vector = [
            route['origin']['lat'],
            route['origin']['lng'],
            route['destination']['lat'],
            route['destination']['lng'],
            int(route['avoid']['tolls']),
            int(route['avoid']['highways']),
            int(route['avoid']['floods']),
            int(route['avoid']['debris'])
        ]
        
        # Labels: distance and safety
        label_vector = [
            route['distance'],
            route['safety']
        ]
        
        features.append(feature_vector)
        labels.append(label_vector)
    
    # Convert to numpy arrays
    X = np.array(features)
    y = np.array(labels)
    
    logger.info(f"Created {len(X)} feature vectors with {X.shape[1]} features each")
    return X, y

def save_processed_data(X, y, scaler, graph, routes, output_dir):
    """Save processed data for model training"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Save feature vectors and labels
    np.save(os.path.join(output_dir, 'features.npy'), X)
    np.save(os.path.join(output_dir, 'labels.npy'), y)
    
    # Save scaler
    torch.save({'scaler': scaler}, os.path.join(output_dir, 'scaler.pth'))
    
    # Save graph as adjacency list with node attributes
    graph_data = {
        'nodes': {str(n): {'lat': graph.nodes[n]['lat'], 'lng': graph.nodes[n]['lng']} for n in graph.nodes()},
        'edges': [{
            'source': str(u),
            'target': str(v),
            'distance': graph[u][v]['distance'],
            'toll': graph[u][v]['toll'],
            'highway': graph[u][v]['highway'],
            'flood_risk': graph[u][v]['flood_risk'],
            'debris_risk': graph[u][v]['debris_risk']
        } for u, v in list(graph.edges())[:1000]]  # OPTIMIZATION: Save only a subset of edges
    }
    
    with open(os.path.join(output_dir, 'graph.json'), 'w') as f:
        json.dump(graph_data, f)
    
    # Save sample routes for visualization
    with open(os.path.join(output_dir, 'sample_routes.json'), 'w') as f:
        json.dump(routes[:min(len(routes), 20)], f)  # Save first 20 routes
    
    logger.info(f"Saved processed data to {output_dir}")

if __name__ == "__main__":
    # Paths
    earthquake_path = "data/earthquake_events.csv"
    tsunami_path = "data/tsunami_events.csv"
    output_dir = "data/processed"
    
    # Load datasets
    earthquake_df, tsunami_df = load_datasets(earthquake_path, tsunami_path)
    
    # Create graph
    G = create_grid_graph()
    
    # Add obstacle features
    G = add_obstacle_features(G, earthquake_df, tsunami_df)
    
    # Generate training routes
    routes = generate_training_routes(G)
    
    # Create feature vectors
    X, y = create_feature_vectors(routes)
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Save processed data
    save_processed_data(X_scaled, y, scaler, G, routes, output_dir)
