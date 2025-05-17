import networkx as nx
import logging
import math

logger = logging.getLogger(__name__)

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    try:
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r
    except Exception as e:
        logger.error(f"Error calculating haversine distance: {e}")
        return 0  # Default to 0 if calculation fails

def build_graph(route_data):
    """
    Build a NetworkX graph from route data.
    
    Args:
        route_data (dict): Route data from OSRM API
        
    Returns:
        networkx.Graph: A graph representing the route
    """
    try:
        G = nx.Graph()
        
        # Extract waypoints from route data
        waypoints = route_data.get('waypoints', [])
        steps = route_data.get('steps', [])
        
        # If no waypoints or steps, create a simple graph with just origin and destination
        if not waypoints and not steps and 'origin' in route_data and 'destination' in route_data:
            origin = route_data['origin']
            destination = route_data['destination']
            
            G.add_node(0, lat=origin['lat'], lng=origin['lng'], name='Origin')
            G.add_node(1, lat=destination['lat'], lng=destination['lng'], name='Destination')
            G.add_edge(0, 1, length=haversine_distance(
                origin['lat'], origin['lng'], destination['lat'], destination['lng']
            ))
            return G
        
        # Add nodes from waypoints
        for i, waypoint in enumerate(waypoints):
            G.add_node(i, 
                      lat=waypoint.get('lat', 0), 
                      lng=waypoint.get('lng', 0),
                      name=waypoint.get('name', f'Waypoint {i}'),
                      type=waypoint.get('type', 'waypoint'))
        
        # Add edges between consecutive waypoints
        for i in range(len(waypoints) - 1):
            wp1 = waypoints[i]
            wp2 = waypoints[i + 1]
            
            distance = haversine_distance(
                wp1.get('lat', 0), wp1.get('lng', 0),
                wp2.get('lat', 0), wp2.get('lng', 0)
            )
            
            G.add_edge(i, i+1, length=distance)
        
        # Add additional edges from steps if available
        for i, step in enumerate(steps):
            if 'from' in step and 'to' in step:
                from_node = step['from'].get('node_id', i)
                to_node = step['to'].get('node_id', i+1)
                
                # Add nodes if they don't exist
                if from_node not in G:
                    G.add_node(from_node,
                              lat=step['from'].get('lat', 0),
                              lng=step['from'].get('lng', 0),
                              name=step['from'].get('name', f'Node {from_node}'))
                
                if to_node not in G:
                    G.add_node(to_node,
                              lat=step['to'].get('lat', 0),
                              lng=step['to'].get('lng', 0),
                              name=step['to'].get('name', f'Node {to_node}'))
                
                # Add edge with distance and duration
                G.add_edge(from_node, to_node,
                          length=step.get('distance', 0),
                          duration=step.get('duration', 0))
        
        # If graph is empty, create a simple graph
        if len(G) == 0:
            logger.warning("Empty graph created, using fallback")
            G.add_node(0, lat=0, lng=0, name='Origin')
            G.add_node(1, lat=1, lng=1, name='Destination')
            G.add_edge(0, 1, length=1)
            
        return G
        
    except Exception as e:
        logger.error(f"Error building graph: {e}")
        # Return a minimal valid graph as fallback
        G = nx.Graph()
        G.add_node(0, lat=0, lng=0, name='Origin')
        G.add_node(1, lat=1, lng=1, name='Destination')
        G.add_edge(0, 1, length=1)
        return G
