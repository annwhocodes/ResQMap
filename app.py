import streamlit as st
import requests
from planner.graph_builder import build_graph
from planner.astar import astar_search
from planner.route_predictor import load_model, predict_route
from visualisation.plot import plot_route
from maps.osrm_adapter import extract_route_from_osrm

# --------------------------
# Helper Functions
# --------------------------

def geocode_location_osm(location):
    """Use Nominatim to convert address to lat/lng."""
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": location,
        "format": "json",
        "limit": 1
    }
    response = requests.get(url, params=params, headers={"User-Agent": "resqmap-app"})
    response.raise_for_status()
    results = response.json()

    if not results:
        raise ValueError(f"Location '{location}' not found.")
    
    lat = float(results[0]["lat"])
    lon = float(results[0]["lon"])
    return lat, lon

def fetch_osrm_route(origin_coords, destination_coords, profile="driving"):
    """Call OSRM API for routing."""
    base_url = f"http://router.project-osrm.org/route/v1/{profile}"
    coords = f"{origin_coords[1]},{origin_coords[0]};{destination_coords[1]},{destination_coords[0]}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "true"
    }
    response = requests.get(f"{base_url}/{coords}", params=params)
    response.raise_for_status()
    return response.json()

# --------------------------
# Streamlit UI
# --------------------------

st.set_page_config(page_title="ResQMap", layout="wide")
st.title("🚨 ResQMap: AI‑Driven Rescue Routing")

tab1, tab2 = st.tabs(["Route Planning", "About"])

with tab1:
    col1, col2 = st.columns(2)
    with col1:
        origin = st.text_input("Origin (address or lat,lng)", "Mumbai")
    with col2:
        destination = st.text_input("Destination (address or lat,lng)", "Pune")

    col1, col2, col3 = st.columns(3)
    with col1:
        mode = st.radio("Routing Algorithm", ["A*", "ML"])
    with col2:
        travel_mode = st.selectbox("Travel Mode", ["driving", "walking", "cycling"])
    with col3:
        avoid_options = st.multiselect("Avoid (note: not supported in OSRM)", ["tolls", "highways", "ferries"])

    col1, col2 = st.columns(2)
    with col1:
        compute_button = st.button("Compute Route", type="primary")
    with col2:
        alternatives = st.checkbox("Show Alternative Routes", value=False)

    if compute_button:
        if not origin or not destination:
            st.error("Please enter both origin and destination.")
        else:
            try:
                with st.spinner("Geocoding locations..."):
                    origin_coords = geocode_location_osm(origin)
                    dest_coords = geocode_location_osm(destination)

                with st.spinner("Fetching route from OSRM..."):
                    osrm_response = fetch_osrm_route(origin_coords, dest_coords, profile=travel_mode)
                    route_data = extract_route_from_osrm(osrm_response)
                    st.success(f"Found route: {route_data['total_distance']/1000:.1f} km, "
                               f"{route_data['total_duration']/60:.0f} minutes")

                with st.spinner("Building network graph..."):
                    G = build_graph(route_data)
                    st.info(f"Graph built with {len(G.nodes)} nodes and {len(G.edges)} edges")

                if mode == "A*":
                    with st.spinner("Computing A* route..."):
                        path = astar_search(G, 0, len(G.nodes)-1)
                else:
                    with st.spinner("Loading ML model..."):
                        try:
                            model, node_to_idx = load_model("route_model.pt")
                            origin_idx = node_to_idx.get(0, 0)
                            dest_idx = node_to_idx.get(len(G.nodes)-1, len(G.nodes)-1)
                            path = predict_route(model, node_to_idx, origin_idx, dest_idx)
                        except FileNotFoundError:
                            st.error("ML model file 'route_model.pt' not found.")
                            st.stop()

                if path:
                    st.success(f"Route found ({mode}): {len(path)} waypoints")
                    with st.expander("Route Waypoints", expanded=False):
                        for i, node in enumerate(path):
                            node_data = G.nodes[node]
                            st.text(f"{i+1}. {node_data['name']} ({node_data['lat']:.4f}, {node_data['lng']:.4f})")
                    plot_route(G, path)
                else:
                    st.error("No route could be found.")

            except Exception as e:
                st.error(f"An unexpected error occurred: {str(e)}")
                with st.expander("Error Details"):
                    import traceback
                    st.code(traceback.format_exc())

with tab2:
    st.markdown("""
    # About ResQMap
    
    ResQMap is an AI-powered tool for computing optimal rescue routes in disaster zones. It uses:
    
    - **A\\*** pathfinding for optimal route planning
    - **Machine Learning** for alternative route prediction
    - **OpenStreetMap + OSRM** for real-world road network data
    
    ## Features
    - Computes the shortest path between locations
    - Visual map display of the computed route
    - ML-based alternative routing (when model is available)
    
    ## Usage Tips
    - You can use addresses or lat/lng coordinates
    - OSRM supports driving, walking, and cycling modes
    - Avoid options are not yet supported in this version
    
    ## Future Work
    - Real-time hazard overlays
    - Integration with emergency services
    - Mobile app for field responders
    """)

st.markdown("""---  
This application uses **OpenStreetMap** and **OSRM** (free and open-source).  
""")
