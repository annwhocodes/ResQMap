import networkx as nx
import heapq
import logging

logger = logging.getLogger(__name__)

def heuristic(a, b, G):
    """
    Calculate the heuristic distance between nodes a and b.
    Uses Euclidean distance based on lat/lng coordinates.
    
    Args:
        a: First node
        b: Second node
        G: NetworkX graph containing the nodes
        
    Returns:
        float: Estimated distance between nodes
    """
    try:
        a_lat = G.nodes[a].get('lat', 0)
        a_lng = G.nodes[a].get('lng', 0)
        b_lat = G.nodes[b].get('lat', 0)
        b_lng = G.nodes[b].get('lng', 0)
        
        # Simple Euclidean distance
        return ((a_lat - b_lat) ** 2 + (a_lng - b_lng) ** 2) ** 0.5
    except Exception as e:
        logger.error(f"Error calculating heuristic: {e}")
        return 0  # Default to 0 if calculation fails

def astar_search(G, start, goal, weight='length', safety_weight=1.0, cost_weight=1.0):
    """
    A* search algorithm for finding the shortest path.
    
    Args:
        G: NetworkX graph
        start: Starting node
        goal: Goal node
        weight: Edge attribute to use as weight
        safety_weight: Weight factor for safety considerations
        cost_weight: Weight factor for cost considerations
        
    Returns:
        list: A list of nodes representing the path from start to goal
    """
    try:
        if start not in G or goal not in G:
            logger.warning(f"Start node {start} or goal node {goal} not in graph")
            return [start, goal]  # Return direct path if nodes not in graph
            
        # Initialize data structures
        frontier = []
        heapq.heappush(frontier, (0, start))
        came_from = {start: None}
        cost_so_far = {start: 0}
        
        while frontier:
            current_cost, current = heapq.heappop(frontier)
            
            if current == goal:
                break
                
            for next_node in G.neighbors(current):
                # Get edge weight, default to 1 if not found
                edge_weight = G.edges[current, next_node].get(weight, 1)
                
                # Apply safety and cost weights if available
                if safety_weight != 1.0 or cost_weight != 1.0:
                    # Adjust weight based on ML model predictions
                    edge_weight = edge_weight * (safety_weight * 0.5 + cost_weight * 0.5)
                
                new_cost = cost_so_far[current] + edge_weight
                
                if next_node not in cost_so_far or new_cost < cost_so_far[next_node]:
                    cost_so_far[next_node] = new_cost
                    priority = new_cost + heuristic(next_node, goal, G)
                    heapq.heappush(frontier, (priority, next_node))
                    came_from[next_node] = current
        
        # Reconstruct path
        if goal not in came_from:
            logger.warning(f"No path found from {start} to {goal}")
            return [start, goal]  # Return direct path if no path found
            
        path = [goal]
        current = goal
        
        while current != start:
            current = came_from[current]
            path.append(current)
            
        path.reverse()
        return path
        
    except Exception as e:
        logger.error(f"Error in A* search: {e}")
        return [start, goal]  # Return direct path as fallback
