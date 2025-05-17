def extract_route_info(serpapi_response):
    """
    Extracts route information from SerpAPI Google Maps response.
    
    Args:
        serpapi_response: The JSON response from SerpAPI
    
    Returns:
        A simplified structure with route information that can be used by the graph builder
    """
    if not serpapi_response or 'directions' not in serpapi_response:
        raise ValueError("Invalid or empty SerpAPI response, missing 'directions' key")
    
    directions = serpapi_response.get('directions', {})
    routes = directions.get('routes', [])
    
    if not routes:
        raise ValueError("No routes found in the API response")
    
    # Use the first route (usually the recommended one)
    primary_route = routes[0]
    legs = primary_route.get('legs', [])
    
    if not legs:
        raise ValueError("No legs found in the primary route")
    
    # Extract waypoints, steps, and other route info
    waypoints = []
    route_steps = []
    
    for leg_idx, leg in enumerate(legs):
        # Add start location as waypoint
        if leg_idx == 0 and 'start_location' in leg:
            waypoints.append({
                'type': 'origin',
                'location': leg['start_location'],
                'name': leg.get('start_address', 'Origin')
            })
        
        # Process all steps in this leg
        for step_idx, step in enumerate(leg.get('steps', [])):
            # Extract step information
            step_info = {
                'distance': step.get('distance', {}).get('value', 0),  # in meters
                'duration': step.get('duration', {}).get('value', 0),  # in seconds
                'start_location': step.get('start_location', {}),
                'end_location': step.get('end_location', {}),
                'instruction': step.get('html_instructions', ''),
                'travel_mode': step.get('travel_mode', 'DRIVING')
            }
            route_steps.append(step_info)
            
            # Add intermediate waypoints for major steps
            if step_idx > 0 and step_idx < len(leg.get('steps', [])) - 1:
                waypoints.append({
                    'type': 'waypoint',
                    'location': step['start_location'],
                    'name': f"Step {leg_idx}-{step_idx}"
                })
        
        # Add end location as waypoint
        if 'end_location' in leg:
            waypoints.append({
                'type': 'destination' if leg_idx == len(legs) - 1 else 'waypoint',
                'location': leg['end_location'],
                'name': leg.get('end_address', 'Destination') if leg_idx == len(legs) - 1 else f"Waypoint {leg_idx}"
            })
    
    return {
        'waypoints': waypoints,
        'steps': route_steps,
        'total_distance': sum(leg.get('distance', {}).get('value', 0) for leg in legs),
        'total_duration': sum(leg.get('duration', {}).get('value', 0) for leg in legs)
    }