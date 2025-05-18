import axios from 'axios';

// API Keys
const API_KEYS = {
  NASA: 'Y1Cdfo9DlGrU5jC9ZhcwWMSdDlZB3xzac22qJUmn',
  NOAA: 'RKetBfTOLiCosTZesHkUNIwsygfpTCxs',
  OPENWEATHER: '80df7ef9d51c1d3f6322bb375bbb62b9'
};

// Hazard types
export type HazardType = 'earthquake' | 'weather' | 'landslide' | 'flood' | 'fire' | 'other';
export type HazardSeverity = 'low' | 'medium' | 'high';

// Hazard interface
export interface Hazard {
  id: string;
  type: HazardType;
  severity: HazardSeverity;
  lat: number;
  lng: number;
  description: string;
  timestamp: string;
  distance?: number; // Distance from reference location in km
  details?: any; // Additional hazard-specific details
}

// Weather forecast interface
export interface WeatherForecast {
  time: string;
  temperature: number;
  condition: string;
  windSpeed: number;
  description: string;
}

// Weather data interface
export interface WeatherData {
  current: {
    temperature: number;
    condition: string;
    description: string;
    windSpeed: number;
    rainfall: number;
    pressure: number;
    humidity: number;
    visibility: number;
    icon: string;
  };
  forecasts: WeatherForecast[];
  warnings: string[];
  severity: HazardSeverity;
}

// Safety score interface
export interface SafetyScore {
  overall: number;
  earthquake: number;
  weather: number;
  landslide: number;
  explanation: string[];
}

class HazardService {
  // Main method to get hazards within radius
  async getHazardsNearLocation(lat: number, lng: number, radiusKm: number = 100): Promise<Hazard[]> {
    try {
      // Fetch hazards from all sources
      const [earthquakes, weather, landslides] = await Promise.all([
        this.fetchEarthquakes(),
        this.fetchWeatherDisasters(),
        this.fetchLandslides()
      ]);

      // Combine all hazards
      const allHazards = [...earthquakes, ...weather, ...landslides];
      
      // Filter by distance and add distance property
      return this.filterHazardsByDistance(allHazards, lat, lng, radiusKm);
    } catch (error) {
      console.error('Error fetching hazards:', error);
      return [];
    }
  }

  // Get weather data for a location
  async getWeatherData(lat: number, lng: number): Promise<WeatherData> {
    try {
      // Get current weather
      const currentResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEYS.OPENWEATHER}&units=metric`
      );
      
      // Get forecast
      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${API_KEYS.OPENWEATHER}&units=metric`
      );
      
      if (!currentResponse.data || !forecastResponse.data) {
        throw new Error('Failed to fetch weather data');
      }
      
      const current = currentResponse.data;
      const forecast = forecastResponse.data;
      
      // Process current weather
      const currentWeather = {
        temperature: current.main.temp,
        condition: current.weather[0].main,
        description: current.weather[0].description,
        windSpeed: current.wind?.speed || 0,
        rainfall: current.rain?.['1h'] || 0,
        pressure: current.main.pressure,
        humidity: current.main.humidity,
        visibility: current.visibility / 1000, // Convert to km
        icon: current.weather[0].icon
      };
      
      // Process forecast
      const forecasts = forecast.list.slice(0, 8).map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        temperature: item.main.temp,
        condition: item.weather[0].main,
        windSpeed: item.wind?.speed || 0,
        description: item.weather[0].description
      }));
      
      // Analyze weather for warnings
      const { warnings, severity } = this.analyzeWeatherData(currentWeather);
      
      return {
        current: currentWeather,
        forecasts,
        warnings,
        severity
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return {
        current: {
          temperature: 0,
          condition: 'Unknown',
          description: 'Weather data unavailable',
          windSpeed: 0,
          rainfall: 0,
          pressure: 0,
          humidity: 0,
          visibility: 0,
          icon: '01d'
        },
        forecasts: [],
        warnings: ['Weather data unavailable'],
        severity: 'low'
      };
    }
  }
  
  // Calculate safety score for a location
  async calculateSafetyScore(lat: number, lng: number): Promise<SafetyScore> {
    try {
      // Get hazards
      const hazards = await this.getHazardsNearLocation(lat, lng, 200); // Wider radius for safety score
      
      // Get weather data
      const weatherData = await this.getWeatherData(lat, lng);
      
      // Initialize scores
      let earthquakeScore = 100;
      let weatherScore = 100;
      let landslideScore = 100;
      const explanation: string[] = [];
      
      // Calculate earthquake risk
      const nearbyEarthquakes = hazards.filter(h => h.type === 'earthquake');
      if (nearbyEarthquakes.length > 0) {
        // Reduce score based on magnitude and distance
        nearbyEarthquakes.forEach(eq => {
          if (eq.distance && eq.details?.magnitude) {
            const impact = (eq.details.magnitude * 10) / Math.max(eq.distance, 1);
            earthquakeScore -= impact;
            
            if (impact > 10) {
              explanation.push(`Major earthquake (M${eq.details.magnitude}) ${eq.distance.toFixed(0)}km away`);
            } else if (impact > 5) {
              explanation.push(`Moderate earthquake activity ${eq.distance.toFixed(0)}km away`);
            }
          }
        });
      } else {
        explanation.push('No recent earthquake activity detected');
      }
      
      // Calculate weather risk
      if (weatherData.warnings.length > 0) {
        // Reduce score based on warnings
        weatherScore -= weatherData.warnings.length * 15;
        weatherData.warnings.forEach(warning => {
          explanation.push(warning);
        });
      } else {
        explanation.push('No severe weather warnings');
      }
      
      // Calculate landslide risk
      const nearbyLandslides = hazards.filter(h => h.type === 'landslide');
      if (nearbyLandslides.length > 0) {
        // Reduce score based on number and distance
        nearbyLandslides.forEach(ls => {
          if (ls.distance) {
            const impact = 100 / Math.max(ls.distance, 1);
            landslideScore -= impact;
            
            if (impact > 10) {
              explanation.push(`Landslide risk ${ls.distance.toFixed(0)}km away`);
            }
          }
        });
      } else {
        explanation.push('No landslide activity detected');
      }
      
      // Ensure scores are within 0-100 range
      earthquakeScore = Math.max(0, Math.min(100, earthquakeScore));
      weatherScore = Math.max(0, Math.min(100, weatherScore));
      landslideScore = Math.max(0, Math.min(100, landslideScore));
      
      // Calculate overall score (weighted average)
      const overall = Math.round((earthquakeScore * 0.4) + (weatherScore * 0.4) + (landslideScore * 0.2));
      
      return {
        overall,
        earthquake: Math.round(earthquakeScore),
        weather: Math.round(weatherScore),
        landslide: Math.round(landslideScore),
        explanation
      };
    } catch (error) {
      console.error('Error calculating safety score:', error);
      return {
        overall: 50,
        earthquake: 50,
        weather: 50,
        landslide: 50,
        explanation: ['Error calculating safety score']
      };
    }
  }

  // Filter hazards by distance from a location
  private filterHazardsByDistance(hazards: Hazard[], lat: number, lng: number, radiusKm: number): Hazard[] {
    return hazards
      .map(hazard => {
        const distance = this.calculateDistance(lat, lng, hazard.lat, hazard.lng);
        return { ...hazard, distance };
      })
      .filter(hazard => hazard.distance <= radiusKm)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  // Analyze weather data for warnings
  private analyzeWeatherData(conditions: any): { warnings: string[], severity: HazardSeverity } {
    const warnings = [];
    let severity: HazardSeverity = 'low';

    // Temperature Warnings
    if (conditions.temperature >= 45) {
      severity = 'high';
      warnings.push('Extreme Heat Warning - Heat Wave Conditions');
    } else if (conditions.temperature >= 40) {
      severity = 'medium';
      warnings.push('Heat Advisory - High Temperature Alert');
    }

    // Cold Temperature Warnings
    if (conditions.temperature <= 5) {
      severity = 'high';
      warnings.push('Extreme Cold Warning - Cold Wave Conditions');
    } else if (conditions.temperature <= 10) {
      severity = 'medium';
      warnings.push('Cold Weather Advisory');
    }

    // Wind Warnings
    if (conditions.windSpeed >= 20) {
      severity = 'high';
      warnings.push('High Wind Warning');
    } else if (conditions.windSpeed >= 15) {
      severity = 'medium';
      warnings.push('Wind Advisory');
    }

    // Rainfall Warnings
    if (conditions.rainfall >= 50) {
      severity = 'high';
      warnings.push('Heavy Rainfall Warning - Flood Risk');
    } else if (conditions.rainfall >= 20) {
      severity = 'medium';
      warnings.push('Rainfall Advisory');
    }

    // Visibility Warnings
    if (conditions.visibility < 1) {
      severity = 'high';
      warnings.push('Low Visibility Warning');
    } else if (conditions.visibility < 2) {
      severity = 'medium';
      warnings.push('Reduced Visibility Advisory');
    }

    return { warnings, severity };
  }

  // Fetch earthquake data from USGS
  private async fetchEarthquakes(): Promise<Hazard[]> {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      const startTime = thirtyDaysAgo.toISOString().split('T')[0];
      const endTime = today.toISOString().split('T')[0];

      // Use global bounding box to get more results
      const response = await axios.get(
        `https://earthquake.usgs.gov/fdsnws/event/1/query?` +
        `format=geojson&starttime=${startTime}&endtime=${endTime}` +
        `&minmagnitude=4.0`
      );

      if (!response.data || !response.data.features) return [];
      
      return response.data.features.map((eq: any) => {
        // Determine severity based on magnitude
        let severity: HazardSeverity = 'low';
        if (eq.properties.mag >= 6.0) severity = 'high';
        else if (eq.properties.mag >= 5.0) severity = 'medium';

        return {
          id: `eq-${eq.id}`,
          type: 'earthquake' as HazardType,
          severity,
          lat: eq.geometry.coordinates[1],
          lng: eq.geometry.coordinates[0],
          description: `Magnitude ${eq.properties.mag} earthquake - ${eq.properties.place}`,
          timestamp: new Date(eq.properties.time).toISOString(),
          details: {
            magnitude: eq.properties.mag,
            depth: eq.geometry.coordinates[2],
            place: eq.properties.place,
            url: eq.properties.url,
            felt: eq.properties.felt,
            tsunami: eq.properties.tsunami
          }
        };
      });
    } catch (error) {
      console.error('Error fetching earthquake data:', error);
      return [];
    }
  }

  // Fetch weather-related disasters from OpenWeather
  private async fetchWeatherDisasters(): Promise<Hazard[]> {
    try {
      // Get data for multiple regions to ensure we have results
      const regions = [
        { lat: 0, lng: 0, zoom: 10 }, // Equator
        { lat: 20, lng: 0, zoom: 10 }, // North Africa
        { lat: -20, lng: 0, zoom: 10 }, // South Africa
        { lat: 0, lng: 90, zoom: 10 }, // India/Asia
        { lat: 0, lng: -90, zoom: 10 }, // South America
        { lat: 40, lng: -100, zoom: 10 }, // North America
        { lat: 40, lng: 100, zoom: 10 }, // Asia
        { lat: -30, lng: 140, zoom: 10 }, // Australia
      ];
      
      const allHazards: Hazard[] = [];
      
      // Process each region
      for (const region of regions) {
        try {
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/find?` +
            `lat=${region.lat}&lon=${region.lng}&cnt=50` +
            `&appid=${API_KEYS.OPENWEATHER}`
          );
          
          if (!response.data || !response.data.list) continue;
          
          const hazards = response.data.list
            .filter((city: any) => {
              const weather = city.weather[0];
              return weather.main.toLowerCase().includes('extreme') ||
                     weather.main.toLowerCase().includes('storm') ||
                     weather.main.toLowerCase().includes('rain') ||
                     weather.main.toLowerCase().includes('snow') ||
                     weather.main.toLowerCase().includes('thunder') ||
                     weather.main.toLowerCase().includes('tornado') ||
                     weather.main.toLowerCase().includes('drizzle') ||
                     weather.main.toLowerCase().includes('mist') ||
                     weather.main.toLowerCase().includes('fog');
            })
            .map((city: any) => {
              // Determine severity based on weather condition
              let severity: HazardSeverity = 'low';
              const condition = city.weather[0].main.toLowerCase();
              
              if (condition.includes('extreme') || 
                  condition.includes('tornado') || 
                  condition.includes('hurricane')) {
                severity = 'high';
              } else if (condition.includes('storm') || 
                         condition.includes('thunder') || 
                         condition.includes('heavy')) {
                severity = 'medium';
              }

              return {
                id: `weather-${city.id}-${Date.now()}`,
                type: 'weather' as HazardType,
                severity,
                lat: city.coord.lat,
                lng: city.coord.lon,
                description: `${city.weather[0].main} - ${city.weather[0].description} in ${city.name}`,
                timestamp: new Date().toISOString(),
                details: {
                  condition: city.weather[0].main,
                  description: city.weather[0].description,
                  temperature: city.main.temp,
                  humidity: city.main.humidity,
                  pressure: city.main.pressure,
                  windSpeed: city.wind?.speed,
                  location: city.name,
                  country: city.sys.country
                }
              };
            });
            
          allHazards.push(...hazards);
        } catch (error) {
          console.error(`Error fetching weather for region ${region.lat},${region.lng}:`, error);
        }
      }
      
      return allHazards;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return [];
    }
  }

  // Fetch landslide data from NASA EONET
  private async fetchLandslides(): Promise<Hazard[]> {
    try {
      const response = await axios.get(
        `https://eonet.gsfc.nasa.gov/api/v3/events?category=landslides&status=open&limit=50`
      );

      if (!response.data || !response.data.events) return [];

      return response.data.events
        .filter((event: any) => event.geometry && event.geometry.length > 0)
        .map((event: any) => {
          // Most recent geometry point
          const geometry = event.geometry[0];
          
          // Determine severity (could be enhanced with more data)
          let severity: HazardSeverity = 'medium';
          
          return {
            id: `landslide-${event.id}`,
            type: 'landslide' as HazardType,
            severity,
            // EONET returns [lon, lat], so we need to reverse
            lng: geometry.coordinates[0],
            lat: geometry.coordinates[1],
            description: event.title,
            timestamp: new Date(geometry.date).toISOString(),
            details: {
              title: event.title,
              sources: event.sources,
              categories: event.categories,
              date: geometry.date
            }
          };
        });
    } catch (error) {
      console.error('Error fetching landslide data:', error);
      return [];
    }
  }
  
  // Get heatmap data for a region
  async getHeatmapData(centerLat: number, centerLng: number, radiusKm: number = 500): Promise<any[]> {
    try {
      console.log("Generating heatmap data around", centerLat, centerLng);
      
      // Generate grid of points around center
      const points = [];
      const step = 0.5; // Degrees
      const latRange = radiusKm / 111; // Approx conversion to degrees
      const lngRange = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180));
      
      for (let lat = centerLat - latRange; lat <= centerLat + latRange; lat += step) {
        for (let lng = centerLng - lngRange; lng <= centerLng + lngRange; lng += step) {
          // Skip points outside the radius
          const distance = this.calculateDistance(centerLat, centerLng, lat, lng);
          if (distance <= radiusKm) {
            points.push({ lat, lng });
          }
        }
      }
      
      console.log(`Generated ${points.length} grid points for heatmap`);
      
      // For performance reasons, use a simpler approach for demo
      // Instead of calculating risk for each point, generate synthetic data
      const heatmapData = [];
      
      for (const point of points) {
        // Calculate distance from center
        const distance = this.calculateDistance(centerLat, centerLng, point.lat, point.lng);
        
        // Base risk on distance from center (higher near center)
        let riskScore = 100 - (distance / radiusKm * 100);
        
        // Add some random variation
        riskScore += (Math.random() * 30) - 15;
        
        // Ensure risk is between 0-100
        riskScore = Math.min(100, Math.max(0, riskScore));
        
        heatmapData.push([point.lat, point.lng, riskScore]);
      }
      
      console.log(`Generated ${heatmapData.length} heatmap data points`);
      return heatmapData;
    } catch (error) {
      console.error('Error generating heatmap data:', error);
      return [];
    }
  }
}

export default new HazardService();
