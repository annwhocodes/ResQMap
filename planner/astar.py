import networkx as nx

def heuristic(u, v, G):
    ux, uy = G.nodes[u]['lat'], G.nodes[u]['lng']
    vx, vy = G.nodes[v]['lat'], G.nodes[v]['lng']
    return ((ux - vx)**2 + (uy - vy)**2) ** 0.5

def astar_search(G, source, target):
    try:
        return nx.astar_path(G, source, target, heuristic=lambda u,v: heuristic(u,v,G), weight='weight')
    except nx.NetworkXNoPath:
        return []
