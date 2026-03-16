// ============================================
// SMART MAPS & NAVIGATION ENGINE
// ============================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface NavigationRoute {
  mode: 'driving' | 'walking' | 'transit' | 'bicycling';
  distance: string;
  distanceMeters: number;
  duration: string;
  durationSeconds: number;
  estimatedCost?: number;
  currency?: string;
  steps?: NavigationStep[];
  polyline?: string;
  trafficAware?: boolean;
  rushHourWarning?: boolean;
}

export interface NavigationStep {
  instruction: string;
  distance: string;
  duration: string;
  mode: string;
  transitDetails?: {
    line: string;
    departure: string;
    arrival: string;
    stops: number;
  };
}

export interface NearbyPlace {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  rating?: number;
  priceLevel?: number;
  isOpen?: boolean;
  distance?: string;
  photoUrl?: string;
  phoneNumber?: string;
  website?: string;
  openingHours?: string[];
}

export interface RouteComparison {
  driving: NavigationRoute | null;
  walking: NavigationRoute | null;
  transit: NavigationRoute | null;
  recommended: 'driving' | 'walking' | 'transit';
  reasoning: string;
}

// ============================================
// GOOGLE MAPS DEEP LINKS
// ============================================

export function generateGoogleMapsLink(
  destination: Coordinates | string,
  options?: {
    mode?: 'driving' | 'walking' | 'transit' | 'bicycling';
    origin?: Coordinates | string;
  }
): string {
  const baseUrl = 'https://www.google.com/maps';
  
  if (typeof destination === 'string') {
    // Address-based navigation
    const encodedDestination = encodeURIComponent(destination);
    if (options?.origin) {
      const originStr = typeof options.origin === 'string' 
        ? encodeURIComponent(options.origin)
        : `${options.origin.latitude},${options.origin.longitude}`;
      const travelMode = options?.mode || 'driving';
      return `${baseUrl}/dir/?api=1&origin=${originStr}&destination=${encodedDestination}&travelmode=${travelMode}`;
    }
    return `${baseUrl}/search/?api=1&query=${encodedDestination}`;
  }
  
  // Coordinate-based navigation
  const destStr = `${destination.latitude},${destination.longitude}`;
  if (options?.origin) {
    const originStr = typeof options.origin === 'string'
      ? encodeURIComponent(options.origin)
      : `${options.origin.latitude},${options.origin.longitude}`;
    const travelMode = options?.mode || 'driving';
    return `${baseUrl}/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=${travelMode}`;
  }
  return `${baseUrl}/search/?api=1&query=${destStr}`;
}

export function generateWalkingMapsLink(destination: Coordinates | string, origin?: Coordinates | string): string {
  return generateGoogleMapsLink(destination, { mode: 'walking', origin });
}

export function generateDrivingMapsLink(destination: Coordinates | string, origin?: Coordinates | string): string {
  return generateGoogleMapsLink(destination, { mode: 'driving', origin });
}

export function generateTransitMapsLink(destination: Coordinates | string, origin?: Coordinates | string): string {
  return generateGoogleMapsLink(destination, { mode: 'transit', origin });
}

// ============================================
// MULTI-STOP ROUTE GENERATION
// ============================================

export function generateMultiStopRoute(
  stops: Array<{ name: string; coordinates?: Coordinates; address?: string }>,
  mode: 'driving' | 'walking' | 'transit' = 'driving'
): string {
  if (stops.length < 2) return '';
  
  const firstStop = stops[0];
  const lastStop = stops[stops.length - 1];
  
  const origin = firstStop.coordinates 
    ? `${firstStop.coordinates.latitude},${firstStop.coordinates.longitude}`
    : encodeURIComponent(firstStop.address || firstStop.name);
  
  const destination = lastStop.coordinates
    ? `${lastStop.coordinates.latitude},${lastStop.coordinates.longitude}`
    : encodeURIComponent(lastStop.address || lastStop.name);
  
  const waypoints = stops.slice(1, -1).map(stop => 
    stop.coordinates 
      ? `${stop.coordinates.latitude},${stop.coordinates.longitude}`
      : encodeURIComponent(stop.address || stop.name)
  ).join('|');
  
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`;
  if (waypoints) {
    url += `&waypoints=${waypoints}`;
  }
  return url;
}

// ============================================
// GOOGLE MAPS API INTEGRATION
// ============================================

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results[0]) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function reverseGeocode(coords: Coordinates): Promise<string | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results[0]) {
      return data.results[0].formatted_address;
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

export async function getDirections(
  origin: Coordinates | string,
  destination: Coordinates | string,
  mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving',
  options?: {
    departureTime?: Date;
    avoidHighways?: boolean;
    avoidTolls?: boolean;
  }
): Promise<NavigationRoute | null> {
  try {
    const originStr = typeof origin === 'string' 
      ? encodeURIComponent(origin)
      : `${origin.latitude},${origin.longitude}`;
    const destStr = typeof destination === 'string'
      ? encodeURIComponent(destination)
      : `${destination.latitude},${destination.longitude}`;
    
    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
    
    if (options?.departureTime) {
      url += `&departure_time=${Math.floor(options.departureTime.getTime() / 1000)}`;
    }
    if (options?.avoidHighways) {
      url += '&avoid=highways';
    }
    if (options?.avoidTolls) {
      url += '&avoid=tolls';
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.routes[0]) {
      const route = data.routes[0];
      const leg = route.legs[0];
      
      return {
        mode,
        distance: leg.distance.text,
        distanceMeters: leg.distance.value,
        duration: leg.duration.text,
        durationSeconds: leg.duration.value,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.text,
          duration: step.duration.text,
          mode: step.travel_mode,
          transitDetails: step.transit_details ? {
            line: step.transit_details.line.name,
            departure: step.transit_details.departure_stop.name,
            arrival: step.transit_details.arrival_stop.name,
            stops: step.transit_details.num_stops,
          } : undefined,
        })),
        polyline: route.overview_polyline.points,
        trafficAware: mode === 'driving' && leg.duration_in_traffic !== undefined,
        rushHourWarning: leg.duration_in_traffic && leg.duration_in_traffic.value > leg.duration.value * 1.3,
      };
    }
    return null;
  } catch (error) {
    console.error('Directions error:', error);
    return null;
  }
}

export async function compareRoutes(
  origin: Coordinates | string,
  destination: Coordinates | string,
  departureTime?: Date
): Promise<RouteComparison> {
  const [driving, walking, transit] = await Promise.all([
    getDirections(origin, destination, 'driving', { departureTime }),
    getDirections(origin, destination, 'walking'),
    getDirections(origin, destination, 'transit', { departureTime }),
  ]);
  
  // Determine recommended mode based on distance and duration
  let recommended: 'driving' | 'walking' | 'transit' = 'driving';
  let reasoning = '';
  
  if (walking && walking.durationSeconds < 900) { // Less than 15 min walk
    recommended = 'walking';
    reasoning = 'Short distance - walking is the easiest option';
  } else if (transit && driving && transit.durationSeconds < driving.durationSeconds * 1.2) {
    recommended = 'transit';
    reasoning = 'Public transit is efficient and cost-effective for this route';
  } else if (driving) {
    recommended = 'driving';
    reasoning = driving.rushHourWarning 
      ? 'Driving is fastest, but expect traffic delays'
      : 'Driving is the fastest option';
  }
  
  return {
    driving,
    walking,
    transit,
    recommended,
    reasoning,
  };
}

// ============================================
// NEARBY PLACES SEARCH
// ============================================

export type PlaceType = 
  | 'atm' | 'bank' | 'pharmacy' | 'hospital' | 'police' 
  | 'restaurant' | 'cafe' | 'supermarket' | 'convenience_store'
  | 'gas_station' | 'subway_station' | 'train_station' | 'bus_station'
  | 'airport' | 'tourist_attraction' | 'shopping_mall' | 'hotel';

export async function findNearbyPlaces(
  location: Coordinates,
  type: PlaceType,
  radiusMeters: number = 1000
): Promise<NearbyPlace[]> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${radiusMeters}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.results.map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        type: type,
        rating: place.rating,
        priceLevel: place.price_level,
        isOpen: place.opening_hours?.open_now,
        photoUrl: place.photos?.[0]?.photo_reference 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
          : undefined,
      }));
    }
    return [];
  } catch (error) {
    console.error('Nearby places error:', error);
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<NearbyPlace | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,formatted_phone_number,website,opening_hours,rating,price_level,photos&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      const place = data.result;
      return {
        placeId,
        name: place.name,
        address: place.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        type: 'tourist_attraction',
        rating: place.rating,
        priceLevel: place.price_level,
        phoneNumber: place.formatted_phone_number,
        website: place.website,
        openingHours: place.opening_hours?.weekday_text,
        photoUrl: place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
          : undefined,
      };
    }
    return null;
  } catch (error) {
    console.error('Place details error:', error);
    return null;
  }
}

// ============================================
// TRANSPORT COST ESTIMATION
// ============================================

export interface TransportCostEstimate {
  type: 'taxi' | 'uber' | 'metro' | 'bus' | 'train' | 'shuttle';
  name: string;
  estimatedCost: { min: number; max: number };
  currency: string;
  estimatedDuration: string;
  bookingUrl?: string;
  appName?: string;
}

// Country-specific transport cost multipliers (per km base)
const TRANSPORT_COST_DATA: Record<string, { taxi: number; uber: number; metro: number; currency: string }> = {
  US: { taxi: 2.5, uber: 1.8, metro: 0.5, currency: 'USD' },
  UK: { taxi: 3.0, uber: 2.0, metro: 0.8, currency: 'GBP' },
  JP: { taxi: 4.0, uber: 3.0, metro: 0.3, currency: 'JPY' },
  SG: { taxi: 2.0, uber: 1.5, metro: 0.3, currency: 'SGD' },
  IN: { taxi: 0.3, uber: 0.25, metro: 0.1, currency: 'INR' },
  TH: { taxi: 0.5, uber: 0.4, metro: 0.15, currency: 'THB' },
  AE: { taxi: 1.0, uber: 0.8, metro: 0.4, currency: 'AED' },
  FR: { taxi: 2.5, uber: 2.0, metro: 0.4, currency: 'EUR' },
  DE: { taxi: 2.8, uber: 2.2, metro: 0.5, currency: 'EUR' },
  AU: { taxi: 3.0, uber: 2.5, metro: 0.6, currency: 'AUD' },
};

export function estimateTransportCosts(
  distanceKm: number,
  countryCode: string
): TransportCostEstimate[] {
  const costs = TRANSPORT_COST_DATA[countryCode] || TRANSPORT_COST_DATA.US;
  const baseDurationMins = Math.ceil(distanceKm * 3); // Rough estimate: 3 mins per km
  
  return [
    {
      type: 'taxi',
      name: 'Taxi',
      estimatedCost: {
        min: Math.round(distanceKm * costs.taxi * 0.9),
        max: Math.round(distanceKm * costs.taxi * 1.3),
      },
      currency: costs.currency,
      estimatedDuration: `${baseDurationMins}-${Math.ceil(baseDurationMins * 1.3)} mins`,
    },
    {
      type: 'uber',
      name: 'Uber/Grab',
      estimatedCost: {
        min: Math.round(distanceKm * costs.uber * 0.85),
        max: Math.round(distanceKm * costs.uber * 1.5), // Surge pricing
      },
      currency: costs.currency,
      estimatedDuration: `${baseDurationMins}-${Math.ceil(baseDurationMins * 1.2)} mins`,
      appName: 'Uber',
    },
    {
      type: 'metro',
      name: 'Metro/Subway',
      estimatedCost: {
        min: Math.round(distanceKm * costs.metro * 0.8),
        max: Math.round(distanceKm * costs.metro * 1.2),
      },
      currency: costs.currency,
      estimatedDuration: `${Math.ceil(baseDurationMins * 1.2)}-${Math.ceil(baseDurationMins * 1.5)} mins`,
    },
  ];
}

// ============================================
// BEST DEPARTURE TIME CALCULATOR
// ============================================

export interface BestDepartureTime {
  suggestedDepartureTime: Date;
  arrivalTime: Date;
  trafficLevel: 'low' | 'moderate' | 'high';
  reasoning: string;
  alternatives: Array<{
    departureTime: Date;
    arrivalTime: Date;
    trafficLevel: 'low' | 'moderate' | 'high';
  }>;
}

export function calculateBestDepartureTime(
  requiredArrivalTime: Date,
  estimatedDurationMins: number,
  countryCode: string
): BestDepartureTime {
  // Rush hour patterns (simplified - in production, use real-time traffic APIs)
  const rushHours = {
    morning: { start: 7, end: 10 },
    evening: { start: 17, end: 20 },
  };
  
  const arrivalHour = requiredArrivalTime.getHours();
  const dayOfWeek = requiredArrivalTime.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  let bufferMultiplier = 1.0;
  let trafficLevel: 'low' | 'moderate' | 'high' = 'low';
  
  if (!isWeekend) {
    if (arrivalHour >= rushHours.morning.start && arrivalHour <= rushHours.morning.end) {
      bufferMultiplier = 1.5;
      trafficLevel = 'high';
    } else if (arrivalHour >= rushHours.evening.start && arrivalHour <= rushHours.evening.end) {
      bufferMultiplier = 1.4;
      trafficLevel = 'high';
    } else if (arrivalHour >= 10 && arrivalHour <= 16) {
      bufferMultiplier = 1.1;
      trafficLevel = 'moderate';
    }
  }
  
  const adjustedDuration = Math.ceil(estimatedDurationMins * bufferMultiplier);
  const bufferMins = 15; // Safety buffer
  
  const suggestedDepartureTime = new Date(requiredArrivalTime);
  suggestedDepartureTime.setMinutes(
    suggestedDepartureTime.getMinutes() - adjustedDuration - bufferMins
  );
  
  // Generate alternatives
  const alternatives = [-30, -15, 15, 30].map(offsetMins => {
    const altDeparture = new Date(suggestedDepartureTime);
    altDeparture.setMinutes(altDeparture.getMinutes() + offsetMins);
    
    const altArrival = new Date(altDeparture);
    altArrival.setMinutes(altArrival.getMinutes() + adjustedDuration);
    
    return {
      departureTime: altDeparture,
      arrivalTime: altArrival,
      trafficLevel: trafficLevel,
    };
  });
  
  return {
    suggestedDepartureTime,
    arrivalTime: requiredArrivalTime,
    trafficLevel,
    reasoning: trafficLevel === 'high'
      ? `Rush hour traffic expected. Added ${Math.round((bufferMultiplier - 1) * 100)}% buffer time.`
      : trafficLevel === 'moderate'
      ? 'Moderate traffic expected. Slight buffer added.'
      : 'Low traffic expected. Standard travel time.',
    alternatives,
  };
}

// ============================================
// OFFLINE ROUTE DATA
// ============================================

export interface OfflineRouteData {
  from: string;
  to: string;
  coordinates: {
    from: Coordinates;
    to: Coordinates;
  };
  routeSummary: string;
  estimatedDuration: string;
  keyLandmarks: string[];
  savedAt: Date;
}

export function generateOfflineRouteData(
  from: { name: string; coordinates: Coordinates },
  to: { name: string; coordinates: Coordinates },
  routeDetails: NavigationRoute
): OfflineRouteData {
  return {
    from: from.name,
    to: to.name,
    coordinates: {
      from: from.coordinates,
      to: to.coordinates,
    },
    routeSummary: `${routeDetails.distance} - ${routeDetails.duration} by ${routeDetails.mode}`,
    estimatedDuration: routeDetails.duration,
    keyLandmarks: routeDetails.steps?.slice(0, 5).map(s => s.instruction) || [],
    savedAt: new Date(),
  };
}
