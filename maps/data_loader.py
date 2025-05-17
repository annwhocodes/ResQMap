import math
import polyline

def haversine(coord1, coord2):
    R = 6371000
    lat1, lon1 = map(math.radians, coord1)
    lat2, lon2 = map(math.radians, coord2)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def preprocess_map_data(raw_data):
    """
    Decodes the overview polyline into nodes & edges with distances.
    """
    routes = raw_data.get('routes') or raw_data.get('route')
    if not routes:
        return [], []
    route = routes[0] if isinstance(routes, list) else routes

    # extract polyline
    pl = None
    if 'overview_polyline' in route:
        pl = route['overview_polyline']['points']
    elif 'polyline' in route:
        pl = route['polyline']
    if not pl:
        return [], []

    coords = polyline.decode(pl)
    nodes = [(i, lat, lng) for i, (lat, lng) in enumerate(coords)]
    edges = []
    for i in range(len(coords)-1):
        dist = haversine(coords[i], coords[i+1])
        edges.append((i, i+1, dist))
    return nodes, edges
