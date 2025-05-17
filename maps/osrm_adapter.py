"""
OSRM API adapter to extract route information from OSRM responses.
"""

def extract_route_from_osrm(osrm_response):
    """
    Convert OSRM API response to a standardized route format.
    
    Args:
        osrm_response: JSON response from OSRM API
    
    Returns:
        Dictionary with route details in a standardized format
    """
    try:
        if 'routes' not in osrm_response or not osrm_response['routes']:
            raise ValueError("No routes found in OSRM response")
        
        # Get the first route
        route = osrm_response['routes'][0]
        
        # Extract basic route information
        distance = route['distance']  # meters
        duration = route['duration']  # seconds
        
        # Process geometry (coordinates)
        geometry = route['geometry']['coordinates']
        coords = [(coord[1], coord[0]) for coord in geometry]  # OSRM returns as [lng, lat]
        
        # Process steps from legs
        processed_steps = []
        waypoints = []
        
        for leg_idx, leg in enumerate(route['legs']):
            for step_idx, step in enumerate(leg['steps']):
                # Extract step info
                instruction = step['maneuver']['type']
                if 'modifier' in step['maneuver']:
                    instruction += f" {step['maneuver']['modifier']}"
                    
                step_distance = step['distance']
                step_duration = step['duration']
                
                # Extract locations
                start_location = {
                    'lat': step['maneuver']['location'][1],
                    'lng': step['maneuver']['location'][0]
                }
                
                # Use the next step's start or use geometry for the end location
                if step_idx < len(leg['steps']) - 1:
                    end_location = {
                        'lat': leg['steps'][step_idx + 1]['maneuver']['location'][1],
                        'lng': leg['steps'][step_idx + 1]['maneuver']['location'][0]
                    }
                else:
                    # For the last step in a leg, use the last coordinate from this step's geometry if available
                    # or default to the last coordinate of the entire route
                    if 'geometry' in step and step['geometry']['coordinates']:
                        last_coord = step['geometry']['coordinates'][-1]
                        end_location = {
                            'lat': last_coord[1],
                            'lng': last_coord[0]
                        }
                    else:
                        # Fall back to the last point in the route geometry
                        end_location = {
                            'lat': geometry[-1][1],
                            'lng': geometry[-1][0]
                        }
                
                processed_steps.append({
                    'instruction': instruction,
                    'distance': step_distance,
                    'duration': step_duration,
                    'start_location': start_location,
                    'end_location': end_location,
                    'maneuver': step['maneuver']['type']
                })
                
                # Create waypoint from this step
                name = f"Step {leg_idx+1}.{step_idx+1}"
                if step.get('name', ''):
                    name = step['name']
                
                waypoints.append({
                    'name': name,
                    'location': start_location,
                    'type': 'waypoint'
                })
        
        # Add destination as final waypoint
        if geometry:
            final_coords = geometry[-1]
            
            waypoints.append({
                'name': 'Destination',
                'location': {
                    'lat': final_coords[1],
                    'lng': final_coords[0]
                },
                'type': 'destination'
            })
        
        # Start point
        if waypoints:
            waypoints[0]['name'] = 'Start'
            waypoints[0]['type'] = 'start'
            
        return {
            'total_distance': distance,
            'total_duration': duration,
            'waypoints': waypoints,
            'steps': processed_steps,
            'polyline': coords,  # List of lat,lng points
        }
        
    except Exception as e:
        print(f"Error extracting route from OSRM: {str(e)}")
        raise