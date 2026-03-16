import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// AI ITINERARY ENGINE
// ============================================

export interface TripContext {
  destination: string;
  country: string;
  cities?: string[];
  startDate: string;
  endDate: string;
  travelType?: string;
  budget?: number;
  budgetCurrency?: string;
  numberOfTravelers?: number;
  foodPreference?: string;
  mobilityPreference?: string;
  flights?: any[];
  hotels?: any[];
  activities?: any[];
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  title: string;
  theme: string;
  weather?: { condition: string; tempHigh: number; tempLow: number };
  items: ItineraryItem[];
  totalDistance: number;
  totalDuration: number;
  rushHourNotes: string[];
  alternatives: ItineraryItem[];
}

export interface ItineraryItem {
  time: string;
  endTime?: string;
  name: string;
  type: 'activity' | 'food' | 'transport' | 'rest' | 'flight' | 'hotel';
  location: string;
  address?: string;
  duration: number;
  description?: string;
  tips?: string[];
  crowdLevel?: 'low' | 'moderate' | 'high' | 'very_high';
  bestPhotoTime?: string;
  bookingRequired?: boolean;
  bookingUrl?: string;
  estimatedCost?: number;
  currency?: string;
  isHiddenGem?: boolean;
  weatherSensitive?: boolean;
  indoorAlternative?: string;
}

export async function generateOptimizedItinerary(
  context: TripContext
): Promise<ItineraryDay[]> {
  const systemPrompt = `You are an expert travel planner with deep knowledge of ${context.country}. 
Create highly optimized daily itineraries that:
- Minimize travel distance between consecutive activities
- Avoid peak crowd times at popular attractions
- Account for local rush hours
- Consider weather patterns
- Include local hidden gems alongside popular spots
- Balance activity intensity throughout the day
- Include best photo timing suggestions
- Suggest indoor alternatives for weather-sensitive activities
- Consider meal timing and local restaurant peak hours
- Account for traveler preferences and mobility requirements`;

  const userPrompt = `Create a detailed day-by-day itinerary for a trip to ${context.destination}, ${context.country}.

Trip Details:
- Dates: ${context.startDate} to ${context.endDate}
- Travel Type: ${context.travelType || 'general'}
- Number of Travelers: ${context.numberOfTravelers || 1}
- Budget: ${context.budget ? `${context.budget} ${context.budgetCurrency}` : 'moderate'}
- Food Preference: ${context.foodPreference || 'any'}
- Mobility: ${context.mobilityPreference || 'normal walking'}

${context.flights?.length ? `Flights: ${JSON.stringify(context.flights.map(f => ({ 
  from: f.departureCity, to: f.arrivalCity, 
  departure: f.departureTime, arrival: f.arrivalTime 
})))}` : ''}

${context.hotels?.length ? `Hotels: ${JSON.stringify(context.hotels.map(h => ({ 
  name: h.name, checkIn: h.checkIn, checkOut: h.checkOut 
})))}` : ''}

Return a JSON array of daily itineraries with this structure:
{
  "itinerary": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "title": "Day theme/title",
      "theme": "exploration/relaxation/adventure/cultural/shopping",
      "items": [
        {
          "time": "09:00",
          "endTime": "11:00",
          "name": "Activity name",
          "type": "activity",
          "location": "Location name",
          "address": "Full address",
          "duration": 120,
          "description": "Brief description",
          "tips": ["Tip 1", "Tip 2"],
          "crowdLevel": "moderate",
          "bestPhotoTime": "09:00-10:00 for best lighting",
          "bookingRequired": false,
          "estimatedCost": 25,
          "currency": "USD",
          "isHiddenGem": false,
          "weatherSensitive": true,
          "indoorAlternative": "Nearby museum if weather is bad"
        }
      ],
      "totalDistance": 5.2,
      "totalDuration": 480,
      "rushHourNotes": ["Avoid metro between 5-7 PM"],
      "alternatives": []
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"itinerary": []}');
    return result.itinerary || [];
  } catch (error) {
    console.error('Itinerary generation error:', error);
    return [];
  }
}

// ============================================
// AI CHANGE MANAGER
// ============================================

export interface ChangeImpact {
  severity: 'minor' | 'moderate' | 'major';
  affectedItems: string[];
  suggestedActions: string[];
  rebuildRequired: boolean;
}

export async function analyzeChangeImpact(
  change: {
    type: 'flight_delay' | 'flight_cancel' | 'hotel_change' | 'weather' | 'attraction_closure';
    details: string;
    timing?: string;
  },
  currentItinerary: ItineraryDay[]
): Promise<{ impact: ChangeImpact; updatedItinerary?: ItineraryDay[] }> {
  const systemPrompt = `You are an AI travel change manager. Analyze the impact of travel disruptions and suggest optimal adjustments to maintain the best possible trip experience.`;

  const userPrompt = `A change has occurred during a trip:
  
Change Type: ${change.type}
Details: ${change.details}
${change.timing ? `Timing: ${change.timing}` : ''}

Current Itinerary:
${JSON.stringify(currentItinerary, null, 2)}

Analyze the impact and provide:
1. Severity assessment (minor/moderate/major)
2. List of affected itinerary items
3. Suggested actions to mitigate impact
4. Whether a full itinerary rebuild is needed
5. If rebuild needed, provide an updated itinerary

Return as JSON:
{
  "impact": {
    "severity": "moderate",
    "affectedItems": ["Day 2 morning activities"],
    "suggestedActions": ["Shift activities by 2 hours", "Skip Museum X"],
    "rebuildRequired": false
  },
  "updatedItinerary": null or [updated itinerary if rebuild needed]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Change analysis error:', error);
    return {
      impact: {
        severity: 'moderate',
        affectedItems: ['Unable to analyze'],
        suggestedActions: ['Please review manually'],
        rebuildRequired: false,
      },
    };
  }
}

// ============================================
// VISA INTELLIGENCE ENGINE
// ============================================

export interface VisaRequirements {
  visaRequired: boolean;
  visaType: string;
  processingTime: string;
  validity: string;
  entryType: string;
  fee: { amount: number; currency: string };
  requiredDocuments: Array<{
    document: string;
    description: string;
    mandatory: boolean;
  }>;
  photoSpecs: {
    size: string;
    background: string;
    otherRequirements: string[];
  };
  financialRequirements: {
    minimumBalance: number;
    currency: string;
    proofRequired: string[];
  };
  embassyInfo: {
    name: string;
    address: string;
    phone: string;
    website: string;
    appointmentUrl?: string;
  };
  interviewRequired: boolean;
  commonQuestions: string[];
  tips: string[];
  warnings: string[];
}

export async function getVisaRequirements(
  destinationCountry: string,
  nationality: string
): Promise<VisaRequirements> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a visa and immigration expert. Provide accurate, up-to-date visa requirements. Always err on the side of caution and recommend users verify with official embassy sources.',
      },
      {
        role: 'user',
        content: `Provide detailed visa requirements for a ${nationality} citizen traveling to ${destinationCountry}.

Return as JSON:
{
  "visaRequired": true/false,
  "visaType": "Tourist/Business/etc",
  "processingTime": "X-Y working days",
  "validity": "X months/years",
  "entryType": "single/multiple",
  "fee": { "amount": 100, "currency": "USD" },
  "requiredDocuments": [
    { "document": "Valid Passport", "description": "Min 6 months validity", "mandatory": true }
  ],
  "photoSpecs": {
    "size": "2x2 inches",
    "background": "white",
    "otherRequirements": ["glasses off", "neutral expression"]
  },
  "financialRequirements": {
    "minimumBalance": 5000,
    "currency": "USD",
    "proofRequired": ["Bank statements", "Employment letter"]
  },
  "embassyInfo": {
    "name": "Embassy name",
    "address": "Full address",
    "phone": "+1-xxx-xxx-xxxx",
    "website": "https://...",
    "appointmentUrl": "https://..."
  },
  "interviewRequired": true/false,
  "commonQuestions": ["Purpose of visit?", "Where will you stay?"],
  "tips": ["Apply early", "Keep copies of all documents"],
  "warnings": ["Processing may take longer during peak season"]
}`,
      },
    ],
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ============================================
// IMMIGRATION PREP
// ============================================

export interface ImmigrationPrep {
  arrivalDocuments: Array<{ document: string; description: string; required: boolean }>;
  immigrationQuestions: Array<{ question: string; suggestedAnswer: string }>;
  customsRules: Array<{ rule: string; details: string; penalty?: string }>;
  restrictedItems: Array<{ item: string; restriction: 'prohibited' | 'restricted' | 'declarable' }>;
  arrivalForms: Array<{ form: string; fillOnline?: boolean; url?: string }>;
  healthRequirements: Array<{ requirement: string; details: string }>;
}

export async function getImmigrationPrep(
  destinationCountry: string,
  nationality: string
): Promise<ImmigrationPrep> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an immigration and customs expert. Provide accurate information to help travelers prepare for arrival.',
      },
      {
        role: 'user',
        content: `Provide immigration preparation guide for a ${nationality} citizen arriving in ${destinationCountry}.

Return as JSON with:
- arrivalDocuments: documents needed at immigration
- immigrationQuestions: likely questions with suggested answers
- customsRules: important customs regulations
- restrictedItems: items that are prohibited, restricted, or need declaration
- arrivalForms: any arrival cards or forms required
- healthRequirements: vaccination, health declaration, etc.`,
      },
    ],
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ============================================
// PRE-DEPARTURE CHECKLIST
// ============================================

export interface PackingChecklist {
  categories: Array<{
    name: string;
    items: Array<{
      item: string;
      quantity: number;
      essential: boolean;
      notes?: string;
    }>;
  }>;
  weatherAdvice: string;
  plugType: string;
  voltageInfo: string;
  simEsimOptions: string[];
  documentsChecklist: string[];
  lastMinuteReminders: string[];
}

export async function generatePackingChecklist(
  context: TripContext
): Promise<PackingChecklist> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a travel preparation expert. Create comprehensive, destination-specific packing lists.',
      },
      {
        role: 'user',
        content: `Create a packing checklist for:
- Destination: ${context.destination}, ${context.country}
- Dates: ${context.startDate} to ${context.endDate}
- Travel Type: ${context.travelType || 'general'}
- Travelers: ${context.numberOfTravelers || 1}

Return JSON with categories (electronics, clothing, documents, toiletries, medicine, accessories), weather advice, plug type, voltage info, SIM/eSIM options, and last-minute reminders.`,
      },
    ],
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ============================================
// COUNTRY ESSENTIAL APPS
// ============================================

export interface CountryApps {
  navigation: AppRecommendation[];
  transport: AppRecommendation[];
  payment: AppRecommendation[];
  translation: AppRecommendation[];
  food: AppRecommendation[];
  communication: AppRecommendation[];
  emergency: AppRecommendation[];
  other: AppRecommendation[];
}

export interface AppRecommendation {
  name: string;
  category: string;
  description: string;
  isEssential: boolean;
  isLocal: boolean;
  appStoreUrl?: string;
  playStoreUrl?: string;
  alternatives?: string[];
}

export async function getCountryApps(country: string): Promise<CountryApps> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a travel technology expert. Recommend the best apps for travelers visiting different countries.',
      },
      {
        role: 'user',
        content: `Recommend essential mobile apps for traveling to ${country}. Include both global apps and local alternatives popular in that country.

Categories: navigation, transport (taxi/metro), payment, translation, food delivery, communication, emergency.

Return as JSON with app name, description, whether it's essential, whether it's a local app, and alternatives.`,
      },
    ],
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ============================================
// FOOD INTELLIGENCE
// ============================================

export interface FoodGuide {
  mustTryDishes: Array<{
    name: string;
    description: string;
    priceRange: string;
    where: string;
    vegetarianFriendly: boolean;
    spiceLevel?: string;
  }>;
  restaurantAreas: Array<{
    area: string;
    description: string;
    cuisine: string;
    priceLevel: string;
  }>;
  foodSafetyTips: string[];
  tippingCustoms: string;
  averageMealCosts: {
    budget: string;
    moderate: string;
    upscale: string;
  };
  deliveryApps: string[];
  dietaryOptions: {
    vegetarian: string;
    vegan: string;
    halal: string;
    kosher: string;
    glutenFree: string;
  };
}

export async function getFoodGuide(
  destination: string,
  country: string,
  preferences?: string
): Promise<FoodGuide> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a culinary travel expert. Provide comprehensive food guides for travelers.',
      },
      {
        role: 'user',
        content: `Provide a food guide for ${destination}, ${country}.
${preferences ? `Dietary preferences: ${preferences}` : ''}

Include must-try dishes, best restaurant areas, food safety tips, tipping customs, average meal costs, delivery apps, and options for various dietary restrictions.

Return as detailed JSON.`,
      },
    ],
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ============================================
// SAFETY INTELLIGENCE
// ============================================

export interface SafetyGuide {
  overallSafetyLevel: 'very_safe' | 'safe' | 'moderate' | 'caution' | 'high_risk';
  commonScams: Array<{
    name: string;
    description: string;
    howToAvoid: string;
    locations: string[];
  }>;
  unsafeAreas: Array<{
    area: string;
    reason: string;
    timeRestrictions?: string;
  }>;
  emergencyNumbers: {
    police: string;
    ambulance: string;
    fire: string;
    tourist_police?: string;
  };
  embassyInfo: {
    name: string;
    address: string;
    phone: string;
    emergencyPhone?: string;
  };
  nearbyHospitals: Array<{
    name: string;
    address: string;
    phone: string;
    hasEmergency: boolean;
    speaksEnglish: boolean;
  }>;
  generalTips: string[];
  womenSafetyTips?: string[];
  lgbtSafety?: string;
  healthRisks: string[];
}

export async function getSafetyGuide(
  destination: string,
  country: string,
  nationality: string
): Promise<SafetyGuide> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a travel safety expert. Provide balanced, accurate safety information without being alarmist. Focus on practical advice.',
      },
      {
        role: 'user',
        content: `Provide a comprehensive safety guide for a ${nationality} traveler visiting ${destination}, ${country}.

Include:
- Overall safety level
- Common tourist scams and how to avoid them
- Areas to avoid (with reasons)
- Emergency numbers
- Embassy information for ${nationality} citizens
- Nearby international hospitals
- General safety tips
- Women's safety considerations
- LGBTQ+ safety awareness
- Health risks to be aware of

Return as detailed JSON.`,
      },
    ],
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ============================================
// JET LAG PLAN
// ============================================

export interface JetLagPlan {
  timezoneDifference: number;
  adjustmentDays: number;
  preDeparturePlan: Array<{
    daysBeforeTravel: number;
    sleepTime: string;
    wakeTime: string;
    tips: string[];
  }>;
  flightPlan: {
    sleepOnFlight: string;
    hydration: string;
    movement: string;
    mealTiming: string;
  };
  arrivalDayPlan: {
    activities: string;
    caffeine: string;
    light: string;
    sleep: string;
  };
  recoveryPlan: Array<{
    day: number;
    morningRoutine: string;
    eveningRoutine: string;
    sleepTime: string;
  }>;
}

export async function getJetLagPlan(
  originTimezone: string,
  destinationTimezone: string,
  departureDate: string,
  travelDirection: 'east' | 'west'
): Promise<JetLagPlan> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a sleep and travel wellness expert. Create science-based jet lag recovery plans.',
      },
      {
        role: 'user',
        content: `Create a jet lag management plan:
- Origin timezone: ${originTimezone}
- Destination timezone: ${destinationTimezone}
- Departure date: ${departureDate}
- Direction: ${travelDirection}

Include pre-departure sleep adjustment, flight recommendations, arrival day strategy, and recovery plan.

Return as JSON.`,
      },
    ],
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ============================================
// SHOPPING ASSISTANT
// ============================================

export interface ShoppingGuide {
  bestShoppingAreas: Array<{
    name: string;
    type: string;
    description: string;
    bestFor: string[];
    priceLevel: string;
  }>;
  localBestBuys: Array<{
    item: string;
    description: string;
    whereToGet: string;
    priceRange: string;
  }>;
  taxRefund: {
    eligible: boolean;
    minimumPurchase: number;
    currency: string;
    refundPercentage: number;
    process: string[];
    claimLocations: string[];
  };
  bargainingTips: string[];
  paymentOptions: string[];
}

export async function getShoppingGuide(destination: string, country: string): Promise<ShoppingGuide> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a travel shopping expert. Help travelers make the most of shopping experiences.',
      },
      {
        role: 'user',
        content: `Provide a shopping guide for ${destination}, ${country}.

Include best shopping areas, local products worth buying, tax refund process and eligibility, bargaining tips, and payment options.

Return as JSON.`,
      },
    ],
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ============================================
// AI CHAT - In-App Assistant
// ============================================

export async function chatWithAI(
  message: string,
  tripContext: TripContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const systemPrompt = `You are an AI travel assistant helping with a trip to ${tripContext.destination}, ${tripContext.country} from ${tripContext.startDate} to ${tripContext.endDate}.

You have access to the following trip context:
- Travel type: ${tripContext.travelType || 'general'}
- Budget: ${tripContext.budget ? `${tripContext.budget} ${tripContext.budgetCurrency}` : 'not specified'}
- Food preferences: ${tripContext.foodPreference || 'any'}
- ${tripContext.flights?.length || 0} flights booked
- ${tripContext.hotels?.length || 0} hotels booked
- ${tripContext.activities?.length || 0} activities planned

Be helpful, concise, and practical. Answer questions about the trip, suggest activities, help with logistics, warn about potential issues, and provide real-time travel advice.

If asked about crowding, transportation, weather, or timing, provide practical advice based on typical patterns for the destination.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory,
    { role: 'user' as const, content: message },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 1000,
  });

  return response.choices[0].message.content || 'I apologize, but I could not generate a response. Please try again.';
}

// ============================================
// LIVE TRAVEL INTELLIGENCE (Placeholder for API integrations)
// ============================================

export interface LiveIntelligence {
  flightStatus?: {
    status: 'on_time' | 'delayed' | 'cancelled' | 'diverted';
    delayMinutes?: number;
    newDepartureTime?: string;
    gate?: string;
    terminal?: string;
    message?: string;
  };
  weather?: {
    current: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    forecast: Array<{ day: string; condition: string; high: number; low: number }>;
    alerts?: string[];
  };
  localAlerts?: Array<{
    type: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    affectedAreas: string[];
    validUntil?: string;
  }>;
}

// These functions would integrate with real APIs in production
export async function getFlightStatus(flightNumber: string, date: string): Promise<LiveIntelligence['flightStatus']> {
  // In production: Integrate with FlightAware, AeroDataBox, or similar APIs
  console.log(`Checking flight status for ${flightNumber} on ${date}`);
  return {
    status: 'on_time',
    message: 'Flight is operating as scheduled',
  };
}

export async function getWeather(destination: string): Promise<LiveIntelligence['weather']> {
  // In production: Integrate with OpenWeatherMap, WeatherAPI, or similar
  console.log(`Fetching weather for ${destination}`);
  return {
    current: 'Partly Cloudy',
    temperature: 25,
    feelsLike: 27,
    humidity: 60,
    forecast: [
      { day: 'Today', condition: 'Partly Cloudy', high: 28, low: 22 },
      { day: 'Tomorrow', condition: 'Sunny', high: 30, low: 23 },
    ],
  };
}

export async function getLocalAlerts(country: string): Promise<LiveIntelligence['localAlerts']> {
  // In production: Integrate with local news APIs, government travel advisories
  console.log(`Checking alerts for ${country}`);
  return [];
}
