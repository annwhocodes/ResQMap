"""
Basic plotting utilities for visualizing routes in the console or returning data
for frontend visualization.
"""

import matplotlib.pyplot as plt
import networkx as nx
import numpy as np

def plot_route(G, path=None, show=False, save_path=None):
    """
    Plot a route on a graph. If no path is provided, just plot the graph.
    
    Args:
        G: NetworkX graph
        path: List of node IDs representing a path
        show: Whether to display the plot
        save_path: Path to save the plot image
    
    Returns:
        Dictionary with plot data
    """
    # Extract node positions
    pos = {}
    for node in G.nodes():
        pos[node] = (G.nodes[node]['lng'], G.nodes[node]['lat'])
    
    # Create figure
    plt.figure(figsize=(10, 8))
    
    # Draw the full graph
    nx.draw_networkx_edges(G, pos, alpha=0.2, edge_color='gray')
    
    # Draw nodes
    nx.draw_networkx_nodes(G, pos, node_size=30, alpha=0.5, node_color='darkblue')
    
    # If path is provided, highlight it
    if path:
        path_edges = list(zip(path[:-1], path[1:]))
        nx.draw_networkx_edges(G, pos, edgelist=path_edges, width=2, edge_color='red')
        nx.draw_networkx_nodes(G, pos, nodelist=path, node_size=50, node_color='red')
        
        # Highlight start and end
        if path:
            nx.draw_networkx_nodes(G, pos, nodelist=[path[0]], node_size=100, node_color='green')
            nx.draw_networkx_nodes(G, pos, nodelist=[path[-1]], node_size=100, node_color='purple')
    
    # Add labels
    start_node = 0
    end_node = len(G.nodes) - 1
    labels = {start_node: 'Start', end_node: 'End'}
    nx.draw_networkx_labels(G, pos, labels=labels, font_size=12, font_color='black')
    
    # Set plot limits with some padding
    lngs = np.array([pos[n][0] for n in G.nodes()])
    lats = np.array([pos[n][1] for n in G.nodes()])
    plt.xlim(lngs.min() - 0.01, lngs.max() + 0.01)
    plt.ylim(lats.min() - 0.01, lats.max() + 0.01)
    
    # Clean up the plot
    plt.title("Route Visualization")
    plt.axis('off')
    
    # Save if requested
    if save_path:
        plt.savefig(save_path, bbox_inches='tight')
    
    # Show if requested (will be False in API mode)
    if show:
        plt.show()
    else:
        plt.close()
    
    # Prepare return data for API
    route_data = {}
    if path:
        route_data['path'] = path
        route_data['nodes'] = [{'id': n, 'lat': G.nodes[n]['lat'], 'lng': G.nodes[n]['lng']} for n in path]
        route_data['edges'] = [{'from': u, 'to': v, 'weight': G.edges[u, v]['weight']} for u, v in path_edges]
    
    return route_data