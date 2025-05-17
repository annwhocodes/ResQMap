import networkx as nx
from planner.astar import astar_search

def test_astar_simple():
    G = nx.path_graph(3)  # nodes 0-1-2
    path = astar_search(G, 0, 2)
    assert path == [0,1,2]
