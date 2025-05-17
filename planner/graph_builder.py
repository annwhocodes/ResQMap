import networkx as nx
import math

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r * 1000  # Return in meters

def build_graph(route_data):
    """
    Builds a NetworkX graph from processed route data
    
    Args:
        route_data: The output from extract_route_from_gmaps()
    
    Returns:
        A NetworkX graph representing the route
    """
    G = nx.DiGraph()
    
    # Add nodes (waypoints)
    for i, waypoint in enumerate(route_data['waypoints']):
        # Extract location data
        location = waypoint['location']
        lat = location.get('lat', 0)
        lng = location.get('lng', 0)
        
        # Add node with attributes
        G.add_node(i, 
                   pos=(lng, lat),  # For visualization
                   name=waypoint['name'],
                   type=waypoint['type'],
                   lat=lat,
                   lng=lng)
    
    # Add edges between consecutive waypoints
    for i in range(len(route_data['waypoints']) - 1):
        start_wp = route_data['waypoints'][i]
        end_wp = route_data['waypoints'][i+1]
        
        # Extract location data
        start_lat = start_wp['location'].get('lat', 0)
        start_lng = start_wp['location'].get('lng', 0)
        end_lat = end_wp['location'].get('lat', 0)
        end_lng = end_wp['location'].get('lng', 0)
        
        # Calculate distance using haversine formula
        distance = haversine_distance(start_lat, start_lng, end_lat, end_lng)
        
        # Find matching steps to get duration information
        duration = 0
        for step in route_data['steps']:
            step_start_lat = step['start_location'].get('lat', 0)
            step_start_lng = step['start_location'].get('lng', 0)
            step_end_lat = step['end_location'].get('lat', 0)
            step_end_lng = step['end_location'].get('lng', 0)
            
            # If this step approximates our waypoints segment, use its duration
            if (abs(step_start_lat - start_lat) < 0.01 and abs(step_start_lng - start_lng) < 0.01):
                duration = step['duration']
                break
        
        # Add edge with distance as weight
        G.add_edge(i, i+1, 
                   weight=distance,  # Primary weight for A* is distance
                   distance=distance,  # Store actual distance in meters
                   duration=duration,  # Store duration in seconds
                   type='route_segment')
    
    # Add metadata to the graph
    G.graph['total_distance'] = route_data['total_distance']
    G.graph['total_duration'] = route_data['total_duration']
    G.graph['polyline'] = route_data.get('polyline', '')
    
    return G