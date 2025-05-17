import json
import logging

logger = logging.getLogger(__name__)

def extract_route_from_osrm(osrm_response):
    """
    Extract route information from OSRM API response.
    
    Args:
        osrm_response (dict): Response from OSRM API
        
    Returns:
        dict: Extracted route data
    """
    try:
        # Check if response contains routes
        if 'routes' not in osrm_response or not osrm_response['routes']:
            logger.warning("No routes found in OSRM response")
            return {
                'total_distance': 0,
                'total_duration': 0,
                'waypoints': [],
                'polyline': [],
                'steps': []
            }
        
        # Get the first route (best match)
        route = osrm_response['routes'][0]
        
        # Extract basic route information
        total_distance = route.get('distance', 0)
        total_duration = route.get('duration', 0)
        
        # Extract geometry (polyline)
        polyline = []
        if 'geometry' in route and 'coordinates' in route['geometry']:
            polyline = route['geometry']['coordinates']
        
        # Extract steps from legs
        steps = []
        if 'legs' in route:
            for leg in route['legs']:
                if 'steps' in leg:
                    for step in leg['steps']:
                        step_data = {
                            'distance': step.get('distance', 0),
                            'duration': step.get('duration', 0),
                            'name': step.get('name', ''),
                            'instruction': step.get('maneuver', {}).get('instruction', '')
                        }
                        
                        # Extract locations if available
                        if 'location' in step:
                            step_data['location'] = step['location']
                        
                        steps.append(step_data)
        
        # Create waypoints from polyline (simplified)
        waypoints = []
        if polyline:
            # Use start, end, and some points in between
            num_points = len(polyline)
            indices = [0]
            
            if num_points > 2:
                # Add some intermediate points
                step = max(1, num_points // 10)  # Take about 10% of points
                indices.extend(range(step, num_points - 1, step))
            
            indices.append(num_points - 1)  # Add end point
            
            for i, idx in enumerate(indices):
                if idx < len(polyline):
                    lng, lat = polyline[idx]
                    waypoints.append({
                        'lat': lat,
                        'lng': lng,
                        'name': f'Waypoint {i}'
                    })
        
        return {
            'total_distance': total_distance,
            'total_duration': total_duration,
            'waypoints': waypoints,
            'polyline': polyline,
            'steps': steps
        }
        
    except Exception as e:
        logger.error(f"Error extracting route from OSRM: {e}")
        # Return minimal valid structure
        return {
            'total_distance': 0,
            'total_duration': 0,
            'waypoints': [],
            'polyline': [],
            'steps': []
        }
