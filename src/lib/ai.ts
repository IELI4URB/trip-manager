import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// AI Provider Configuration
const USE_CLAUDE = !!process.env.ANTHROPIC_API_KEY;

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

// Unified AI completion
async function getCompletion(systemPrompt: string, userPrompt: string, maxTokens = 2000): Promise<string> {
  if (USE_CLAUDE && anthropic) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text');
    return textBlock?.text || '';
  } else if (openai) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
    });
    return response.choices[0]?.message?.content || '';
  }
  throw new Error('No AI provider configured');
}

export interface TripContext {
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  flights?: any[];
  hotels?: any[];
  activities?: any[];
}

export async function getAISuggestions(context: TripContext, type: string): Promise<string> {
  const systemPrompt = `You are an expert travel assistant AI. Provide helpful, practical, and actionable travel advice. Be concise but thorough. Format responses in a clear, readable way.`;

  let userPrompt = '';

  switch (type) {
    case 'peak_hours':
      userPrompt = `For a trip to ${context.destination}, ${context.country} from ${context.startDate} to ${context.endDate}, provide advice on:
1. Peak tourist hours at popular attractions and how to avoid them
2. Best times to visit major spots
3. Rush hour traffic patterns and when to avoid travel
4. Local holidays or events that might cause crowds
Format as a helpful list with specific time recommendations.`;
      break;

    case 'visa':
      userPrompt = `Provide a comprehensive visa checklist for traveling to ${context.country}. Include:
1. Required documents
2. Application process steps
3. Processing times
4. Important tips and common mistakes to avoid
5. Any specific requirements based on nationality (general guidance)
Format as a detailed checklist.`;
      break;

    case 'essentials':
      userPrompt = `Create a packing essentials list for ${context.destination}, ${context.country} for the dates ${context.startDate} to ${context.endDate}. Include:
1. Electronics and adapters needed
2. Clothing recommendations based on weather
3. Important documents
4. Toiletries and medicine
5. Country-specific must-haves
6. Things NOT to bring
Format as categorized lists.`;
      break;

    case 'food':
      userPrompt = `Provide food recommendations for ${context.destination}, ${context.country}:
1. Must-try local dishes
2. Popular restaurant areas
3. Food safety tips
4. Budget options vs fine dining
5. Dietary restriction considerations
6. Tipping customs
Format as an organized guide.`;
      break;

    case 'apps':
      userPrompt = `Recommend essential mobile apps for traveling to ${context.country}:
1. Navigation & Maps
2. Translation
3. Local transport (ride-sharing, public transit)
4. Payment & Money
5. Communication
6. Food delivery
7. Travel planning
Include both global apps and local alternatives popular in ${context.country}.`;
      break;

    case 'transport':
      userPrompt = `Provide transportation guide from airport to city/hotel in ${context.destination}, ${context.country}:
1. All available transport options (taxi, metro, bus, shuttle, etc.)
2. Estimated costs for each option
3. Duration and convenience comparison
4. How to book or find each option
5. Tips for first-time visitors
6. Safety considerations`;
      break;

    case 'money':
      userPrompt = `Provide money and card advice for ${context.country}:
1. Best ways to carry money
2. Credit/debit card acceptance
3. ATM availability and fees
4. Currency exchange tips
5. Forex card recommendations
6. Estimated daily budget (budget/moderate/luxury)
7. Tipping expectations`;
      break;

    case 'general':
      userPrompt = `Provide general travel tips for ${context.destination}, ${context.country} from ${context.startDate} to ${context.endDate}:
1. Weather and what to expect
2. Cultural norms and etiquette
3. Safety tips
4. Emergency contacts
5. Language basics
6. SIM card / connectivity options`;
      break;
  }

  try {
    return await getCompletion(systemPrompt, userPrompt, 2000);
  } catch (error) {
    console.error('AI API error:', error);
    return 'AI suggestions are temporarily unavailable. Please check your API key configuration.';
  }
}

export async function parseDocumentWithAI(text: string): Promise<any> {
  const systemPrompt = `You are an expert at extracting travel information from documents. Extract structured data from the provided text and return it as JSON.`;

  const userPrompt = `Extract travel booking information from this document text:

${text}

Return a JSON object with the following structure (include only fields that are present):
{
  "type": "flight" | "hotel",
  "flight": {
    "airline": string,
    "flightNumber": string,
    "departureCity": string,
    "arrivalCity": string,
    "departureTime": ISO datetime string,
    "arrivalTime": ISO datetime string,
    "terminal": string,
    "gate": string,
    "seatNumber": string,
    "bookingRef": string
  },
  "hotel": {
    "name": string,
    "address": string,
    "checkIn": ISO datetime string,
    "checkOut": ISO datetime string,
    "roomType": string,
    "bookingRef": string,
    "confirmationNumber": string,
    "contactPhone": string
  }
}`;

  try {
    const content = await getCompletion(systemPrompt, userPrompt, 1000);
    // Extract JSON from response
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error('Document parsing error:', error);
    return null;
  }
}

export async function generateActivitySuggestions(context: TripContext): Promise<any[]> {
  const systemPrompt = `You are a travel activity recommender. Suggest activities and experiences based on the destination and travel dates.`;

  const userPrompt = `Suggest 10 activities/experiences for a trip to ${context.destination}, ${context.country} from ${context.startDate} to ${context.endDate}.

For each activity, provide:
- name: Activity name
- description: Brief description
- location: Where it takes place
- estimatedDuration: Duration in minutes
- estimatedPrice: Approximate cost in local currency
- category: One of: sightseeing, adventure, food, entertainment, relaxation
- bestTime: Best time of day to do this
- peakHourWarning: Any crowd warnings

Return as a JSON array.`;

  try {
    const content = await getCompletion(systemPrompt, userPrompt, 2000);
    // Extract JSON from response
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    const parsed = JSON.parse(jsonStr.trim());
    return parsed.activities || parsed;
  } catch (error) {
    console.error('Activity suggestions error:', error);
    return [];
  }
}
