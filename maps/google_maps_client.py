import requests
import urllib.parse
import os
import json
import time

class GoogleMapsClient:
    """
    Client for Google Maps Directions API
    """
    BASE_URL = "https://maps.googleapis.com/maps/api/directions/json"
    
    def __init__(self, api_key=None):
        """
        Initialize with Google Maps API key
        """
        self.api_key = api_key or os.getenv("GOOGLE_MAPS_API_KEY")
        if not self.api_key:
            raise ValueError("Google Maps API key not provided and not found in environment variables")
    
    def get_directions(self, origin, destination, mode="driving", alternatives=False, avoid=None):
        """
        Get directions from origin to destination
        
        Args:
            origin (str): Starting point (address or lat,lng)
            destination (str): Ending point (address or lat,lng)
            mode (str): Travel mode - driving, walking, bicycling, or transit
            alternatives (bool): Whether to return alternative routes
            avoid (list): Features to avoid - tolls, highways, ferries
            
        Returns:
            dict: JSON response from the Google Maps Directions API
        """
        # Encode parameters
        params = {
            "origin": origin,
            "destination": destination,
            "mode": mode,
            "alternatives": "true" if alternatives else "false",
            "key": self.api_key,
        }
        
        # Add avoidance parameters if specified
        if avoid:
            params["avoid"] = "|".join(avoid)
            
        # Make request
        try:
            response = requests.get(self.BASE_URL, params=params)
            response.raise_for_status()  # Raise exception for 4XX/5XX status codes
            
            data = response.json()
            
            # Check API response status
            if data["status"] != "OK":
                if data["status"] == "ZERO_RESULTS":
                    raise ValueError(f"No route found between {origin} and {destination}")
                else:
                    raise ValueError(f"API Error: {data['status']} - {data.get('error_message', 'No error message')}")
            
            return data
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Failed to connect to Google Maps API: {str(e)}")
    
    def get_cached_directions(self, origin, destination, cache_file=None, max_age_hours=24):
        """
        Get directions with caching to reduce API calls (useful for development)
        
        Args:
            origin (str): Starting point
            destination (str): Ending point
            cache_file (str): Path to cache file (default: ./gmaps_cache.json)
            max_age_hours (int): Maximum age of cached data in hours
            
        Returns:
            dict: JSON response from the Google Maps Directions API
        """
        cache_file = cache_file or "gmaps_cache.json"
        cache = {}
        
        # Create cache key
        cache_key = f"{origin}|{destination}"
        
        # Try to load existing cache
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'r') as f:
                    cache = json.load(f)
            except (json.JSONDecodeError, IOError):
                # If cache file is corrupt or can't be read, use empty cache
                cache = {}
        
        # Check if we have a valid cached entry
        if cache_key in cache:
            entry = cache[cache_key]
            cache_time = entry.get("timestamp", 0)
            current_time = time.time()
            
            # If cache is not too old, return cached data
            if (current_time - cache_time) < (max_age_hours * 3600):
                return entry["data"]
        
        # No valid cache, fetch from API
        data = self.get_directions(origin, destination)
        
        # Update cache
        cache[cache_key] = {
            "timestamp": time.time(),
            "data": data
        }
        
        # Save cache
        try:
            with open(cache_file, 'w') as f:
                json.dump(cache, f)
        except IOError:
            pass  # Silently fail if we can't write to cache
            
        return data