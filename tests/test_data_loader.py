from maps.data_loader import preprocess_map_data

def test_preprocess_empty():
    nodes, edges = preprocess_map_data({})
    assert nodes == [] and edges == []

def test_preprocess_mock():
    # A simple mock polyline for two points
    data = {'routes':[{'overview_polyline': {'points': '??'}}]}
    # Using an invalid polyline yields empty
    assert preprocess_map_data(data) == ([], [])
