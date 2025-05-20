export const CITIES = {
  // Major cities with precise coordinates
  "Delhi": { lat: 28.6139, lng: 77.209 },
  "Mumbai": { lat: 19.076, lng: 72.8777 },
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Bangalore": { lat: 12.9716, lng: 77.5946 },
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Hyderabad": { lat: 17.385, lng: 78.4867 },
  "Pune": { lat: 18.551, lng: 73.855 }, // From hazard data

  // Additional coordinates from prediction data (approximated to nearby cities/regions)
  "Arunachal Pradesh": { lat: 27.348106031893156, lng: 93.88146838475902 },
  "Tamil Nadu South": { lat: 11.354786527494511, lng: 84.71808422374923 },
  "Lahore Region": { lat: 31.671318161612803, lng: 73.8898683679459 },
  "Central India": { lat: 20.75175385029798, lng: 82.6454613798874 },
  "Ladakh": { lat: 34.09002025538652, lng: 78.89956450682124 },
  "Tibet Border": { lat: 34.80785000625134, lng: 86.69789424030293 },
  "South Central India": { lat: 14.364545166260516, lng: 86.53327671257387 },
  "West Maharashtra": { lat: 21.611763599856594, lng: 74.7115463168518 },
  "Myanmar Border": { lat: 16.627167509070002, lng: 96.9335815284033 },
  "Lhasa Region": { lat: 29.296517850433354, lng: 86.5005223873801 },
  "Andaman Islands": { lat: 10.250884740718543, lng: 91.52099806426045 },
  "Mongolia Border": { lat: 33.44598863641975, lng: 96.04447225156194 },
  "Chhattisgarh": { lat: 20.171145936207992, lng: 82.63246665109901 }
};

// Helper function to get coordinates by city name
export const getCoordinatesByCity = (cityName: string): { lat: number, lng: number } | null => {
  return CITIES[cityName] || null;
};

// Helper function to find the closest city to given coordinates
export const findClosestCity = (lat: number, lng: number): string | null => {
  let closestCity = null;
  let minDistance = Infinity;
  
  Object.entries(CITIES).forEach(([city, coords]) => {
    const distance = Math.sqrt(
      Math.pow(coords.lat - lat, 2) + Math.pow(coords.lng - lng, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  });
  
  return closestCity;
};