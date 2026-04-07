import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// AI Provider Configuration for Document Parsing
// Note: Image parsing requires OpenAI or Gemini (vision support)
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const gemini = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Check which providers are available
function hasVisionProvider(): boolean {
  return !!(openai || gemini);
}

function hasTextProvider(): boolean {
  return !!(groq || gemini || anthropic || openai);
}

// Unified text completion for document parsing
async function getDocumentParseCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
  if (groq) {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
    });
    return response.choices[0]?.message?.content || '{}';
  } else if (gemini) {
    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { maxOutputTokens: 2000 },
    });
    return result.response.text();
  } else if (anthropic) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text');
    return textBlock?.text || '{}';
  } else if (openai) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });
    return response.choices[0]?.message?.content || '{}';
  }
  throw new Error('No AI provider configured. Set GROQ_API_KEY, GOOGLE_AI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY');
}

// ============================================
// SMART DOCUMENT PARSING ENGINE
// ============================================

export interface ParsedFlightData {
  airline?: string;
  flightNumber?: string;
  pnr?: string;
  departureCity?: string;
  departureAirport?: string;
  departureAirportCode?: string;
  departureTerminal?: string;
  departureGate?: string;
  departureTime?: string;
  arrivalCity?: string;
  arrivalAirport?: string;
  arrivalAirportCode?: string;
  arrivalTerminal?: string;
  arrivalTime?: string;
  seatNumber?: string;
  cabinClass?: string;
  bookingRef?: string;
  baggageAllowance?: string;
  webCheckinUrl?: string;
}

export interface ParsedHotelData {
  name?: string;
  address?: string;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  checkInTime?: string;
  checkOutTime?: string;
  roomType?: string;
  numberOfRooms?: number;
  bookingRef?: string;
  confirmationNumber?: string;
  contactPhone?: string;
  contactEmail?: string;
  cancellationPolicy?: string;
  totalCost?: number;
  currency?: string;
  amenities?: string[];
}

export interface ParsedVisaData {
  visaType?: string;
  visaNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  entryType?: string; // single, multiple
  duration?: string;
  restrictions?: string[];
  issuingAuthority?: string;
}

export interface ParsedDocumentResult {
  type: 'flight' | 'hotel' | 'visa' | 'insurance' | 'train' | 'bus' | 'forex' | 'other';
  confidence: number;
  data: ParsedFlightData | ParsedHotelData | ParsedVisaData | Record<string, any>;
  rawText?: string;
  warnings?: string[];
}

// Parse document using AI Vision + Text extraction
export async function parseDocument(
  fileContent: string,
  mimeType: string,
  fileName: string
): Promise<ParsedDocumentResult> {
  try {
    // Determine document type from filename or content
    const documentType = detectDocumentType(fileName, fileContent);
    
    // Use Vision API for images AND PDFs (AI vision models can read PDFs directly)
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';
    const needsVision = isImage || isPdf;
    
    let extractedData: ParsedDocumentResult;
    
    if (needsVision) {
      extractedData = await parseImageDocument(fileContent, mimeType, documentType);
    } else {
      extractedData = await parseTextDocument(fileContent, documentType);
    }
    
    return extractedData;
  } catch (error) {
    console.error('Document parsing error:', error);
    return {
      type: 'other',
      confidence: 0,
      data: {},
      warnings: ['Failed to parse document. Please enter details manually.'],
    };
  }
}

function detectDocumentType(fileName: string, content: string): string {
  const lowerName = fileName.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  // Flight indicators
  if (
    lowerName.includes('ticket') ||
    lowerName.includes('flight') ||
    lowerName.includes('boarding') ||
    lowerContent.includes('flight number') ||
    lowerContent.includes('pnr') ||
    lowerContent.includes('boarding pass') ||
    lowerContent.includes('e-ticket')
  ) {
    return 'flight';
  }
  
  // Hotel indicators
  if (
    lowerName.includes('hotel') ||
    lowerName.includes('booking') ||
    lowerName.includes('reservation') ||
    lowerContent.includes('check-in') ||
    lowerContent.includes('check-out') ||
    lowerContent.includes('room type') ||
    lowerContent.includes('confirmation number')
  ) {
    return 'hotel';
  }
  
  // Visa indicators
  if (
    lowerName.includes('visa') ||
    lowerContent.includes('visa') ||
    lowerContent.includes('entry permit') ||
    lowerContent.includes('valid until')
  ) {
    return 'visa';
  }
  
  // Insurance
  if (
    lowerName.includes('insurance') ||
    lowerContent.includes('travel insurance') ||
    lowerContent.includes('policy number')
  ) {
    return 'insurance';
  }
  
  // Train
  if (
    lowerName.includes('train') ||
    lowerContent.includes('train ticket') ||
    lowerContent.includes('railway')
  ) {
    return 'train';
  }
  
  return 'other';
}

async function parseImageDocument(
  base64Content: string,
  mimeType: string,
  documentType: string
): Promise<ParsedDocumentResult> {
  const prompt = getExtractionPrompt(documentType);
  const systemPrompt = `You are an expert document parser specializing in travel documents. Extract all relevant information from the document and return it as JSON. Be precise with dates, times, and reference numbers. Parse ALL text visible in the document carefully.`;
  
  // Try Gemini first for vision (free tier) - supports both images and PDFs
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\n${prompt}` },
            { inlineData: { mimeType: mimeType, data: base64Content } }
          ]
        }],
        generationConfig: { maxOutputTokens: 2000 },
      });
      const content = result.response.text();
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      const parsed = JSON.parse(jsonStr.trim());
      return {
        type: documentType as any,
        confidence: parsed.confidence || 0.8,
        data: parsed.data || parsed,
        warnings: parsed.warnings,
      };
    } catch (error) {
      console.error('Gemini vision parsing error:', error);
    }
  }
  
  // Fallback to OpenAI if available - for PDFs, OpenAI needs image format
  if (openai) {
    // OpenAI vision API works best with images; for PDFs we'd need conversion
    // But GPT-4o can handle PDFs via URL or base64 as images in some cases
    const dataUrl = `data:${mimeType};base64,${base64Content}`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      type: documentType as any,
      confidence: result.confidence || 0.8,
      data: result.data || result,
      warnings: result.warnings,
    };
  }
  
  // No vision provider available
  return {
    type: 'other',
    confidence: 0,
    data: {},
    warnings: ['Image parsing requires Google AI (Gemini) or OpenAI API key. Please enter details manually or upload a text/PDF document.'],
  };
}

async function parseTextDocument(
  textContent: string,
  documentType: string
): Promise<ParsedDocumentResult> {
  const prompt = getExtractionPrompt(documentType);
  const systemPrompt = `You are an expert document parser specializing in travel documents. Extract all relevant information from the text and return it as JSON. Be precise with dates, times, and reference numbers. IMPORTANT: Return ONLY valid JSON, no markdown or extra text.`;
  const userPrompt = `${prompt}\n\nDocument content:\n${textContent}`;
  
  try {
    const content = await getDocumentParseCompletion(systemPrompt, userPrompt);
    
    // Extract JSON from response (handles markdown code blocks)
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    const result = JSON.parse(jsonStr.trim());
    
    return {
      type: documentType as any,
      confidence: result.confidence || 0.8,
      data: result.data || result,
      rawText: textContent,
      warnings: result.warnings,
    };
  } catch (error) {
    console.error('Text document parsing error:', error);
    return {
      type: documentType as any,
      confidence: 0.3,
      data: {},
      rawText: textContent,
      warnings: ['Failed to parse document automatically. Please review and enter details manually.'],
    };
  }
}

function getExtractionPrompt(documentType: string): string {
  switch (documentType) {
    case 'flight':
      return `Extract flight ticket information from this document. This is a FLIGHT TICKET or E-TICKET.

IMPORTANT INSTRUCTIONS:
1. Look carefully for the ACTUAL flight dates and times printed on the ticket
2. Flight dates are usually in formats like "15 Apr 2024", "April 15, 2024", "15/04/2024", etc.
3. Flight times are in formats like "14:30", "2:30 PM", "1430 hrs"
4. Convert all dates/times to ISO 8601 format: YYYY-MM-DDTHH:MM:SS (e.g., 2024-04-15T14:30:00)
5. If you cannot find a specific field, use null - DO NOT use "Unknown" or made-up values
6. The airline name is usually prominently displayed (e.g., "Air India", "Emirates", "IndiGo")
7. Flight numbers look like "AI302", "EK504", "6E2341"
8. PNR/Booking Reference is usually a 6-character alphanumeric code

Return as JSON:
{
  "type": "flight",
  "confidence": 0.0-1.0,
  "data": {
    "airline": "Airline name (e.g., Air India, Emirates) - null if not found",
    "flightNumber": "e.g., AI302 - null if not found",
    "pnr": "PNR/Booking reference (6-char code) - null if not found",
    "departureCity": "City name - null if not found",
    "departureAirport": "Full airport name - null if not found",
    "departureAirportCode": "3-letter IATA code e.g., DEL - null if not found",
    "departureTerminal": "Terminal number - null if not found",
    "departureGate": "Gate if available - null if not found",
    "departureTime": "MUST be in ISO format YYYY-MM-DDTHH:MM:SS - null if not found",
    "arrivalCity": "City name - null if not found",
    "arrivalAirport": "Full airport name - null if not found",
    "arrivalAirportCode": "3-letter IATA code e.g., SIN - null if not found",
    "arrivalTerminal": "Terminal number - null if not found",
    "arrivalTime": "MUST be in ISO format YYYY-MM-DDTHH:MM:SS - null if not found",
    "seatNumber": "e.g., 23A - null if not found",
    "cabinClass": "economy/premium_economy/business/first - null if not found",
    "baggageAllowance": "e.g., 23kg checked, 7kg cabin - null if not found",
    "passengerName": "Full name - null if not found"
  },
  "warnings": ["Any important notices or parsing issues"]
}

If you cannot extract meaningful flight information, set confidence to 0 and return empty/null fields.`;

    case 'hotel':
      return `Extract hotel booking information and return as JSON with these fields:
{
  "type": "hotel",
  "confidence": 0.0-1.0,
  "data": {
    "name": "Hotel name",
    "address": "Full address",
    "city": "City name",
    "checkIn": "ISO date format",
    "checkOut": "ISO date format",
    "checkInTime": "e.g., 15:00",
    "checkOutTime": "e.g., 11:00",
    "roomType": "Room type description",
    "numberOfRooms": 1,
    "bookingRef": "Booking reference",
    "confirmationNumber": "Confirmation number",
    "contactPhone": "Hotel phone",
    "contactEmail": "Hotel email",
    "cancellationPolicy": "Policy description",
    "totalCost": 0.00,
    "currency": "USD",
    "amenities": ["wifi", "breakfast", "parking"],
    "guestName": "Guest name"
  },
  "warnings": ["Any important notices like cancellation deadlines"]
}`;

    case 'visa':
      return `Extract visa document information and return as JSON with these fields:
{
  "type": "visa",
  "confidence": 0.0-1.0,
  "data": {
    "visaType": "Tourist/Business/Work etc",
    "visaNumber": "Visa number",
    "issueDate": "ISO date format",
    "expiryDate": "ISO date format",
    "entryType": "single/multiple/double",
    "duration": "e.g., 90 days",
    "restrictions": ["Any restrictions"],
    "issuingAuthority": "Embassy/Consulate name",
    "countryOfVisa": "Country name"
  },
  "warnings": ["Any important restrictions or requirements"]
}`;

    default:
      return `Extract all relevant travel information from this document and return as JSON with:
{
  "type": "detected document type",
  "confidence": 0.0-1.0,
  "data": {
    // All relevant extracted fields
  },
  "warnings": ["Any important notices"]
}`;
  }
}

// ============================================
// BATCH DOCUMENT PROCESSING
// ============================================

export async function processMultipleDocuments(
  documents: Array<{ content: string; mimeType: string; fileName: string }>
): Promise<ParsedDocumentResult[]> {
  const results = await Promise.all(
    documents.map((doc) => parseDocument(doc.content, doc.mimeType, doc.fileName))
  );
  return results;
}

// ============================================
// EMAIL PARSING (for forwarded booking emails)
// ============================================

export async function parseEmailContent(emailContent: string): Promise<ParsedDocumentResult[]> {
  const systemPrompt = `You are an expert at parsing travel booking confirmation emails. Extract all booking information (flights, hotels, activities) and return as JSON array. IMPORTANT: Return ONLY valid JSON with a "bookings" key containing an array.`;
  const userPrompt = `Parse this email and extract all travel booking information:\n\n${emailContent}`;
  
  try {
    const content = await getDocumentParseCompletion(systemPrompt, userPrompt);
    
    // Extract JSON from response
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    const result = JSON.parse(jsonStr.trim());
    
    return result.bookings || [];
  } catch (error) {
    console.error('Email parsing error:', error);
    return [];
  }
}
