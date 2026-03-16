import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    
    // Use GPT-4 Vision for images, GPT-4 for text/PDF content
    const isImage = mimeType.startsWith('image/');
    
    let extractedData: ParsedDocumentResult;
    
    if (isImage) {
      extractedData = await parseImageDocument(fileContent, documentType);
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
  base64Image: string,
  documentType: string
): Promise<ParsedDocumentResult> {
  const prompt = getExtractionPrompt(documentType);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert document parser specializing in travel documents. Extract all relevant information from the image and return it as JSON. Be precise with dates, times, and reference numbers.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
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

async function parseTextDocument(
  textContent: string,
  documentType: string
): Promise<ParsedDocumentResult> {
  const prompt = getExtractionPrompt(documentType);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert document parser specializing in travel documents. Extract all relevant information from the text and return it as JSON. Be precise with dates, times, and reference numbers.`,
      },
      {
        role: 'user',
        content: `${prompt}\n\nDocument content:\n${textContent}`,
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
    rawText: textContent,
    warnings: result.warnings,
  };
}

function getExtractionPrompt(documentType: string): string {
  switch (documentType) {
    case 'flight':
      return `Extract flight ticket information and return as JSON with these fields:
{
  "type": "flight",
  "confidence": 0.0-1.0,
  "data": {
    "airline": "Airline name",
    "flightNumber": "e.g., AI302",
    "pnr": "PNR/Booking reference",
    "departureCity": "City name",
    "departureAirport": "Full airport name",
    "departureAirportCode": "e.g., DEL",
    "departureTerminal": "Terminal number",
    "departureGate": "Gate if available",
    "departureTime": "ISO datetime format",
    "arrivalCity": "City name",
    "arrivalAirport": "Full airport name",
    "arrivalAirportCode": "e.g., SIN",
    "arrivalTerminal": "Terminal number",
    "arrivalTime": "ISO datetime format",
    "seatNumber": "e.g., 23A",
    "cabinClass": "economy/premium_economy/business/first",
    "baggageAllowance": "e.g., 23kg checked, 7kg cabin",
    "passengerName": "Full name"
  },
  "warnings": ["Any important notices"]
}`;

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
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert at parsing travel booking confirmation emails. Extract all booking information (flights, hotels, activities) and return as JSON array.`,
      },
      {
        role: 'user',
        content: `Parse this email and extract all travel booking information:\n\n${emailContent}`,
      },
    ],
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });
  
  const result = JSON.parse(response.choices[0].message.content || '{"bookings": []}');
  return result.bookings || [];
}
