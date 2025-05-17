def extract_route_from_osrm(osrm_response):
    """
    Enhanced OSRM response parser with detailed waypoints
    """
    try:
        if not osrm_response.get('routes'):
            raise ValueError("No routes found in OSRM response")

        main_route = osrm_response['routes'][0]
        geometry = main_route['geometry']['coordinates']
        
        # Extract critical points
        waypoints = []
        seen_locations = set()

        for leg in main_route['legs']:
            for step in leg['steps']:
                # Add maneuver points
                man_location = (
                    step['maneuver']['location'][1],
                    step['maneuver']['location'][0]
                )
                if man_location not in seen_locations:
                    waypoints.append({
                        "name": step.get('name', 'Maneuver'),
                        "location": {"lat": man_location[0], "lng": man_location[1]},
                        "type": "maneuver"
                    })
                    seen_locations.add(man_location)

                # Add intersections
                for intersection in step.get('intersections', []):
                    loc = (intersection['location'][1], intersection['location'][0])
                    if loc not in seen_locations:
                        waypoints.append({
                            "name": "Intersection",
                            "location": {"lat": loc[0], "lng": loc[1]},
                            "type": "intersection"
                        })
                        seen_locations.add(loc)

        # Add start and end explicitly
        if geometry:
            start = {"lat": geometry[0][1], "lng": geometry[0][0]}
            end = {"lat": geometry[-1][1], "lng": geometry[-1][0]}
            waypoints.insert(0, {"name": "Start", "location": start, "type": "start"})
            waypoints.append({"name": "End", "location": end, "type": "destination"})

        return {
            "total_distance": main_route['distance'],
            "total_duration": main_route['duration'],
            "waypoints": waypoints,
            "steps": main_route['legs'][0]['steps'],
            "polyline": [(coord[1], coord[0]) for coord in geometry]
        }

    except Exception as e:
        print(f"OSRM parsing error: {str(e)}")
        raise