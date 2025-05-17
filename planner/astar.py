import networkx as nx
from planner.graph_builder import haversine_distance

def heuristic(u, v, G):
    """Proper Haversine heuristic for geographic coordinates"""
    u_lat, u_lng = G.nodes[u]['lat'], G.nodes[u]['lng']
    v_lat, v_lng = G.nodes[v]['lat'], G.nodes[v]['lng']
    return haversine_distance(u_lat, u_lng, v_lat, v_lng)

def astar_search(G, source, target):
    """Wrapper for NetworkX A* with proper geographic heuristic"""
    try:
        return nx.astar_path(G, source, target, 
                           heuristic=lambda u,v: heuristic(u,v,G), 
                           weight='distance')  # Changed to use 'distance' instead of 'weight'
    except nx.NetworkXNoPath:
        return []