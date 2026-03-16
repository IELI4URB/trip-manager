import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  geocodeAddress,
  getDirections,
  compareRoutes,
  findNearbyPlaces,
  getPlaceDetails,
  generateGoogleMapsLink,
  generateMultiStopRoute,
  estimateTransportCosts,
  calculateBestDepartureTime,
  Coordinates,
  PlaceType,
} from '@/lib/navigation';

// POST /api/trips/[id]/navigation - Navigation operations
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, data } = body;

    // Verify trip exists
    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { id: true, country: true },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    let result: any;

    switch (action) {
      case 'geocode':
        // Geocode an address to coordinates
        result = await geocodeAddress(data.address);
        break;

      case 'directions':
        // Get directions between two points
        result = await getDirections(
          data.origin,
          data.destination,
          data.mode || 'driving',
          {
            departureTime: data.departureTime ? new Date(data.departureTime) : undefined,
            avoidHighways: data.avoidHighways,
            avoidTolls: data.avoidTolls,
          }
        );
        break;

      case 'compare_routes':
        // Compare routes across different transport modes
        result = await compareRoutes(
          data.origin,
          data.destination,
          data.departureTime ? new Date(data.departureTime) : undefined
        );
        break;

      case 'nearby':
        // Find nearby places
        const location: Coordinates = {
          latitude: data.latitude,
          longitude: data.longitude,
        };
        result = await findNearbyPlaces(
          location,
          data.type as PlaceType,
          data.radius || 1000
        );
        break;

      case 'place_details':
        // Get details for a specific place
        result = await getPlaceDetails(data.placeId);
        break;

      case 'generate_link':
        // Generate Google Maps deep link
        const destination = data.coordinates || data.address;
        const origin = data.originCoordinates || data.originAddress;
        result = {
          url: generateGoogleMapsLink(destination, {
            mode: data.mode,
            origin,
          }),
        };
        break;

      case 'multi_stop_route':
        // Generate multi-stop route
        result = {
          url: generateMultiStopRoute(data.stops, data.mode || 'driving'),
        };
        break;

      case 'estimate_costs':
        // Estimate transport costs
        result = estimateTransportCosts(data.distanceKm, trip.country);
        break;

      case 'best_departure':
        // Calculate best departure time
        result = calculateBestDepartureTime(
          new Date(data.arrivalTime),
          data.durationMinutes,
          trip.country
        );
        break;

      case 'save_location':
        // Save a location to the trip
        const locationData = {
          tripId: id,
          type: data.type,
          name: data.name,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          googlePlaceId: data.placeId,
          phoneNumber: data.phoneNumber,
          website: data.website,
          openingHours: data.openingHours ? JSON.stringify(data.openingHours) : null,
          rating: data.rating,
          priceLevel: data.priceLevel,
          isSaved: true,
          notes: data.notes,
        };

        const savedLocation = await prisma.location.create({
          data: locationData,
        });
        result = savedLocation;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Navigation API error:', error);
    return NextResponse.json(
      { error: 'Navigation request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/trips/[id]/navigation - Get saved locations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: any = { tripId: id };
    if (type) {
      where.type = type;
    }

    const locations = await prisma.location.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Navigation GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
