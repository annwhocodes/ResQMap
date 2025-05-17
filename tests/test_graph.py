import networkx as nx
from planner.graph_builder import build_graph

def test_build_graph_empty():
    data = {'routes': []}
    G = build_graph(data)
    assert isinstance(G, nx.Graph)
