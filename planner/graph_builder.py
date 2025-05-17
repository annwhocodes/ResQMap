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
    """Builds a proper graph with connection alternatives"""
    G = nx.DiGraph()
    
    # Create nodes with geographic IDs
    nodes = {}
    for idx, waypoint in enumerate(route_data['waypoints']):
        location = waypoint['location']
        lat = location['lat']
        lng = location['lng']
        node_id = f"{lat:.6f}_{lng:.6f}"
        nodes[idx] = node_id
        
        G.add_node(node_id,
                   name=waypoint['name'],
                   type=waypoint['type'],
                   lat=lat,
                   lng=lng)
    
    # Connect nodes bidirectionally where possible
    for i in range(len(route_data['waypoints']) - 1):
        start = nodes[i]
        end = nodes[i+1]
        
        # Calculate forward distance
        distance = haversine_distance(
            G.nodes[start]['lat'], G.nodes[start]['lng'],
            G.nodes[end]['lat'], G.nodes[end]['lng']
        )
        
        # Add both directions with same weight
        G.add_edge(start, end, distance=distance)
        G.add_edge(end, start, distance=distance)
    
    # Add alternative connections between nearby nodes
    coordinates = [(G.nodes[n]['lat'], G.nodes[n]['lng']) for n in G.nodes]
    for i, (lat1, lng1) in enumerate(coordinates):
        for j, (lat2, lng2) in enumerate(coordinates[i+1:], start=i+1):
            if haversine_distance(lat1, lng1, lat2, lng2) < 500:  # 500m threshold
                dist = haversine_distance(lat1, lng1, lat2, lng2)
                n1 = list(G.nodes)[i]
                n2 = list(G.nodes)[j]
                if not G.has_edge(n1, n2):
                    G.add_edge(n1, n2, distance=dist)
                if not G.has_edge(n2, n1):
                    G.add_edge(n2, n1, distance=dist)
    
    # Add metadata
    G.graph.update({
        'total_distance': route_data['total_distance'],
        'total_duration': route_data['total_duration'],
        'polyline': route_data.get('polyline', [])
    })
    
    return G