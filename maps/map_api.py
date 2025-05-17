import requests
import os
from urllib.parse import quote

# Base URL for Nominatim geocoding service (OpenStreetMap)
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
# Base URL for OSRM routing service
OSRM_URL = "https://router.project-osrm.org/route/v1/driving"

def geocode_location(location):
    """Convert address to coordinates using OpenStreetMap's Nominatim"""
    if not location:
        raise ValueError("Location must be provided")
        
    # Check if already in coordinate format (lat,lng)
    if ',' in location and all(part.replace('.', '', 1).replace('-', '', 1).isdigit() 
                             for part in location.split(',')):
        lat, lng = map(float, location.split(','))
        return {'lat': lat, 'lng': lng}
    
    # Use Nominatim for geocoding
    params = {
        'q': location,
        'format': 'json',
        'limit': 1
    }
    
    headers = {
        'User-Agent': 'RapidRescue/1.0' # Important for Nominatim ToS
    }
    
    try:
        response = requests.get(NOMINATIM_URL, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            raise ValueError(f"Could not geocode location: {location}")
            
        return {
            'lat': float(data[0]['lat']),
            'lng': float(data[0]['lon']),
            'display_name': data[0]['display_name']
        }
    except requests.exceptions.RequestException as e:
        print(f"Geocoding error: {e}")
        raise

def fetch_road_network(origin, destination):
    """Fetch route using OpenStreetMap's OSRM service"""
    # First geocode both locations
    origin_coords = geocode_location(origin)
    destination_coords = geocode_location(destination)
    
    # Format coordinates for OSRM (lng,lat order for OSRM!)
    origin_str = f"{origin_coords['lng']},{origin_coords['lat']}"
    destination_str = f"{destination_coords['lng']},{destination_coords['lat']}"
    
    # Build URL for OSRM
    url = f"{OSRM_URL}/{origin_str};{destination_str}"
    
    # Parameters
    params = {
        'alternatives': 'true',  # Get alternative routes
        'steps': 'true',         # Get turn-by-turn instructions
        'geometries': 'geojson',  # Get GeoJSON format for route geometry
        'overview': 'full'       # Get full route overview
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Routing error: {e}")
        raise