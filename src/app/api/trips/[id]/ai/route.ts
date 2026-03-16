import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  generateOptimizedItinerary,
  analyzeChangeImpact,
  getVisaRequirements,
  getImmigrationPrep,
  generatePackingChecklist,
  getCountryApps,
  getFoodGuide,
  getSafetyGuide,
  getJetLagPlan,
  getShoppingGuide,
  chatWithAI,
  TripContext,
} from '@/lib/ai-engine';

// Legacy import for backward compatibility
import { getAISuggestions, generateActivitySuggestions } from '@/lib/ai';

// Helper for SQLite-compatible bulk insert
async function bulkCreate<T extends Record<string, any>>(
  model: { create: (args: { data: T }) => Promise<any> },
  items: T[]
): Promise<void> {
  for (const item of items) {
    await model.create({ data: item });
  }
}

// POST /api/trips/[id]/ai - AI-powered trip assistance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, type, data } = body;

    // Fetch trip context
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        flights: true,
        hotels: true,
        activities: true,
        dailyItinerary: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const context: TripContext = {
      destination: trip.destination,
      country: trip.country,
      cities: trip.cities ? JSON.parse(trip.cities) : undefined,
      startDate: trip.startDate.toISOString().split('T')[0],
      endDate: trip.endDate.toISOString().split('T')[0],
      travelType: trip.travelType || undefined,
      budget: trip.budget || undefined,
      budgetCurrency: trip.budgetCurrency || undefined,
      numberOfTravelers: trip.numberOfTravelers,
      foodPreference: trip.foodPreference || undefined,
      mobilityPreference: trip.mobilityPreference || undefined,
      flights: trip.flights,
      hotels: trip.hotels,
      activities: trip.activities,
    };

    let result: any;

    // Support legacy 'type' parameter for backward compatibility
    const actionType = action || type;

    switch (actionType) {
      case 'generate_itinerary':
        result = await generateOptimizedItinerary(context);
        
        // Save itinerary to database
        if (result.length > 0) {
          await prisma.dailyItinerary.deleteMany({ where: { tripId: id } });
          
          await bulkCreate(prisma.dailyItinerary, result.map((day: any) => ({
            tripId: id,
            date: new Date(day.date),
            dayNumber: day.dayNumber,
            title: day.title,
            items: JSON.stringify(day.items),
            weatherNote: day.weather ? JSON.stringify(day.weather) : null,
            rushHourNote: day.rushHourNotes?.join('; ') || null,
            totalDistance: day.totalDistance,
            totalDuration: day.totalDuration,
            isOptimized: true,
            alternateRoute: day.alternatives ? JSON.stringify(day.alternatives) : null,
          })));
        }
        break;

      case 'analyze_change':
        const currentItinerary = trip.dailyItinerary?.map((di: any) => ({
          dayNumber: di.dayNumber,
          date: di.date.toISOString().split('T')[0],
          title: di.title || '',
          theme: di.theme || '',
          items: JSON.parse(di.items as string || '[]'),
          totalDistance: di.totalDistance || 0,
          totalDuration: di.totalDuration || 0,
          rushHourNotes: di.rushHourNote ? di.rushHourNote.split('; ') : [],
          alternatives: di.alternateRoute ? JSON.parse(di.alternateRoute) : [],
        })) || [];
        result = await analyzeChangeImpact(data?.change || {}, currentItinerary as any);
        
        if (result.updatedItinerary) {
          await prisma.dailyItinerary.deleteMany({ where: { tripId: id } });
          await bulkCreate(prisma.dailyItinerary, result.updatedItinerary.map((day: any) => ({
            tripId: id,
            date: new Date(day.date),
            dayNumber: day.dayNumber,
            title: day.title,
            items: JSON.stringify(day.items),
            isOptimized: true,
          })));
        }
        break;

      case 'visa_requirements':
      case 'visa':
        result = await getVisaRequirements(trip.country, data?.nationality || 'US');
        
        if (result.requiredDocuments) {
          const existingItems = await prisma.visaChecklistItem.count({ where: { tripId: id } });
          if (existingItems === 0) {
            await bulkCreate(prisma.visaChecklistItem, result.requiredDocuments.map((doc: any) => ({
              tripId: id,
              item: doc.document,
              description: doc.description,
              category: 'document',
              isCompleted: false,
              priority: doc.mandatory ? 'critical' : 'medium',
            })));
          }
        }
        break;

      case 'immigration_prep':
        result = await getImmigrationPrep(trip.country, data?.nationality || 'US');
        
        if (result.arrivalDocuments || result.customsRules) {
          const items = [
            ...(result.arrivalDocuments || []).map((d: any) => ({
              tripId: id,
              type: 'document',
              title: d.document,
              description: d.description,
              isRequired: d.required,
              priority: d.required ? 'high' : 'medium',
            })),
            ...(result.customsRules || []).map((r: any) => ({
              tripId: id,
              type: 'customs_rule',
              title: r.rule,
              description: r.details,
              isRequired: true,
              priority: 'medium',
            })),
          ];
          
          await prisma.immigrationPrep.deleteMany({ where: { tripId: id } });
          if (items.length > 0) {
            await bulkCreate(prisma.immigrationPrep, items);
          }
        }
        break;

      case 'packing_checklist':
      case 'essentials':
        result = await generatePackingChecklist(context);
        
        if (result.categories) {
          const existingEssentials = await prisma.essential.count({ where: { tripId: id } });
          if (existingEssentials === 0) {
            const items = result.categories.flatMap((cat: any) =>
              cat.items.map((item: any) => ({
                tripId: id,
                item: item.item,
                category: cat.name.toLowerCase(),
                quantity: item.quantity || 1,
                isPacked: false,
                isEssential: item.essential,
                notes: item.notes || null,
              }))
            );
            await bulkCreate(prisma.essential, items);
          }
        }
        break;

      case 'country_apps':
      case 'apps':
        result = await getCountryApps(trip.country);
        
        const allApps = [
          ...(result.navigation || []),
          ...(result.transport || []),
          ...(result.payment || []),
          ...(result.translation || []),
          ...(result.food || []),
          ...(result.communication || []),
          ...(result.emergency || []),
          ...(result.other || []),
        ];
        
        if (allApps.length > 0) {
          const existingApps = await prisma.recommendedApp.count({ where: { tripId: id } });
          if (existingApps === 0) {
            await bulkCreate(prisma.recommendedApp, allApps.map((app: any) => ({
              tripId: id,
              name: app.name,
              category: app.category || 'other',
              description: app.description,
              isInstalled: false,
              appStoreUrl: app.appStoreUrl || null,
              playStoreUrl: app.playStoreUrl || null,
            })));
          }
        }
        break;

      case 'food_guide':
      case 'food':
        result = await getFoodGuide(trip.destination, trip.country, trip.foodPreference || undefined);
        
        if (result.mustTryDishes) {
          const existingPlaces = await prisma.foodPlace.count({ where: { tripId: id } });
          if (existingPlaces === 0) {
            await bulkCreate(prisma.foodPlace, result.mustTryDishes.map((dish: any) => ({
              tripId: id,
              name: dish.name,
              cuisine: dish.description || 'Local',
              priceRange: dish.priceRange,
              mustTry: dish.name,
              notes: dish.where || null,
            })));
          }
        }
        break;

      case 'safety_guide':
        result = await getSafetyGuide(trip.destination, trip.country, data?.nationality || 'US');
        
        const safetyItems = [
          ...(result.commonScams || []).map((scam: any) => ({
            tripId: id,
            type: 'scam_alert',
            title: scam.name,
            description: `${scam.description}. How to avoid: ${scam.howToAvoid}`,
            location: scam.locations?.join(', ') || null,
            severity: 'medium',
          })),
          ...(result.unsafeAreas || []).map((area: any) => ({
            tripId: id,
            type: 'unsafe_zone',
            title: area.area,
            description: area.reason,
            severity: 'high',
          })),
        ];
        
        if (safetyItems.length > 0) {
          await prisma.safetyInfo.deleteMany({ where: { tripId: id } });
          await bulkCreate(prisma.safetyInfo, safetyItems);
        }
        
        if (result.emergencyNumbers) {
          const emergencyContacts = [
            { type: 'police', name: 'Police', phoneNumber: result.emergencyNumbers.police },
            { type: 'ambulance', name: 'Ambulance', phoneNumber: result.emergencyNumbers.ambulance },
            { type: 'fire', name: 'Fire Department', phoneNumber: result.emergencyNumbers.fire },
          ].filter(c => c.phoneNumber);
          
          const existingContacts = await prisma.emergencyContact.count({ where: { tripId: id } });
          if (existingContacts === 0 && emergencyContacts.length > 0) {
            await bulkCreate(prisma.emergencyContact, emergencyContacts.map((c) => ({ ...c, tripId: id })));
          }
        }
        break;

      case 'jet_lag_plan':
        result = await getJetLagPlan(
          data?.originTimezone || 'America/New_York',
          data?.destinationTimezone || trip.destinationTimezone || 'UTC',
          trip.startDate.toISOString().split('T')[0],
          data?.direction || 'east'
        );
        
        if (result.preDeparturePlan || result.recoveryPlan) {
          await prisma.jetLagPlan.deleteMany({ where: { tripId: id } });
          
          const plans = [
            ...(result.preDeparturePlan || []).map((p: any) => ({
              tripId: id,
              date: new Date(trip.startDate.getTime() - (p.daysBeforeTravel || 1) * 24 * 60 * 60 * 1000),
              phase: 'pre_departure',
              sleepTime: p.sleepTime,
              wakeTime: p.wakeTime,
              activityAdvice: p.tips?.join('; ') || null,
            })),
            ...(result.recoveryPlan || []).map((p: any) => ({
              tripId: id,
              date: new Date(trip.startDate.getTime() + (p.day || 0) * 24 * 60 * 60 * 1000),
              phase: 'adjustment',
              sleepTime: p.sleepTime,
              activityAdvice: `${p.morningRoutine || ''}; ${p.eveningRoutine || ''}`,
            })),
          ];
          
          if (plans.length > 0) {
            await bulkCreate(prisma.jetLagPlan, plans);
          }
        }
        break;

      case 'shopping_guide':
        result = await getShoppingGuide(trip.destination, trip.country);
        break;

      case 'chat':
        const conversationHistory = data?.history || [];
        result = await chatWithAI(data?.message || '', context, conversationHistory);
        
        await prisma.aIChat.create({
          data: {
            tripId: id,
            role: 'user',
            content: data?.message || '',
            context: JSON.stringify(context),
          },
        });
        await prisma.aIChat.create({
          data: {
            tripId: id,
            role: 'assistant',
            content: result,
          },
        });
        
        result = { response: result };
        break;

      case 'activities':
        // Legacy support
        const activities = await generateActivitySuggestions(context);
        return NextResponse.json({ activities });

      case 'peak_hours':
      case 'money':
      case 'transport':
      case 'general':
        // Legacy support for old AI suggestions
        const suggestions = await getAISuggestions(context, actionType);
        
        await prisma.aISuggestion.create({
          data: {
            tripId: id,
            type: actionType,
            title: `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Suggestions`,
            content: suggestions,
            priority: actionType === 'peak_hours' ? 'high' : 'medium',
          },
        });
        
        return NextResponse.json({ suggestions });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'AI request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/trips/[id]/ai - Get AI suggestions and chat history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'chat') {
      const chats = await prisma.aIChat.findMany({
        where: { tripId: id },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json({ chats });
    }

    const suggestions = await prisma.aISuggestion.findMany({
      where: { tripId: id, isDismissed: false },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('AI history error:', error);
    return NextResponse.json({ error: 'Failed to fetch AI data' }, { status: 500 });
  }
}
