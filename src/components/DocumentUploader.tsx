'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  X,
  Upload,
  FileText,
  Image,
  Check,
  AlertCircle,
  Loader2,
  Plane,
  Hotel,
  FileCheck,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DocumentUploaderProps {
  tripId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'parsing' | 'success' | 'error';
  result?: any;
  error?: string;
}

const DOCUMENT_TYPES = [
  { id: 'flight', label: 'Flight Ticket', icon: Plane, color: 'text-blue-500' },
  { id: 'hotel', label: 'Hotel Booking', icon: Hotel, color: 'text-purple-500' },
  { id: 'visa', label: 'Visa Document', icon: FileCheck, color: 'text-green-500' },
  { id: 'insurance', label: 'Travel Insurance', icon: FileText, color: 'text-amber-500' },
  { id: 'passport', label: 'Passport', icon: FileText, color: 'text-red-500' },
  { id: 'forex', label: 'Forex Receipt', icon: CreditCard, color: 'text-cyan-500' },
  { id: 'other', label: 'Other Document', icon: FileText, color: 'text-slate-500' },
];

export default function DocumentUploader({ tripId, onClose, onSuccess }: DocumentUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const processFiles = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    
    for (let i = 0; i < files.length; i++) {
      const uploadedFile = files[i];
      if (uploadedFile.status !== 'pending') continue;

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' as const } : f))
      );

      try {
        // Convert file to base64
        const base64 = await fileToBase64(uploadedFile.file);
        
        // Update status to parsing
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'parsing' as const } : f))
        );

        // Send to parsing API
        const response = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: base64,
            mimeType: uploadedFile.file.type,
            fileName: uploadedFile.file.name,
          }),
        });

        if (!response.ok) throw new Error('Parsing failed');

        const result = await response.json();
        
        // Save document to trip
        if (result.document && result.document.type !== 'other') {
          await saveExtractedData(tripId, result.document);
        }

        // Update status to success
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'success' as const, result: result.document }
              : f
          )
        );

        toast.success(`Parsed ${uploadedFile.file.name}`);
      } catch (error) {
        // Update status to error
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'error' as const, error: 'Failed to parse document' }
              : f
          )
        );
        toast.error(`Failed to parse ${uploadedFile.file.name}`);
      }
    }

    setIsProcessing(false);
    onSuccess();
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const allProcessed = files.length > 0 && files.every((f) => f.status === 'success' || f.status === 'error');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Upload Documents
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Upload tickets, bookings, or travel documents. AI will automatically extract the details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            {isDragActive ? (
              <p className="text-primary-600 dark:text-primary-400 font-medium">
                Drop the files here...
              </p>
            ) : (
              <>
                <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-sm text-slate-400">
                  Supports PDF, PNG, JPG (max 10MB)
                </p>
              </>
            )}
          </div>

          {/* Supported document types */}
          <div className="mt-4 flex flex-wrap gap-2">
            {DOCUMENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-sm"
                >
                  <Icon className={`w-4 h-4 ${type.color}`} />
                  <span className="text-slate-600 dark:text-slate-300">{type.label}</span>
                </div>
              );
            })}
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-medium text-slate-800 dark:text-white">
                Uploaded Files ({files.length})
              </h3>
              {files.map((uploadedFile, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50"
                >
                  {/* File icon */}
                  <div className="flex-shrink-0">
                    {uploadedFile.file.type.startsWith('image/') ? (
                      <Image className="w-8 h-8 text-slate-400" />
                    ) : (
                      <FileText className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {(uploadedFile.file.size / 1024).toFixed(1)} KB
                      {uploadedFile.result?.type && (
                        <span className="ml-2">
                          • Detected: <span className="capitalize">{uploadedFile.result.type}</span>
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    {uploadedFile.status === 'pending' && (
                      <button
                        onClick={() => removeFile(index)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                    {(uploadedFile.status === 'uploading' || uploadedFile.status === 'parsing') && (
                      <div className="flex items-center gap-2 text-primary-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">
                          {uploadedFile.status === 'uploading' ? 'Uploading...' : 'Parsing...'}
                        </span>
                      </div>
                    )}
                    {uploadedFile.status === 'success' && (
                      <div className="flex items-center gap-2 text-green-500">
                        <Check className="w-5 h-5" />
                        <span className="text-sm">Success</span>
                      </div>
                    )}
                    {uploadedFile.status === 'error' && (
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">Failed</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            {allProcessed ? 'Close' : 'Cancel'}
          </button>
          {!allProcessed && (
            <button
              onClick={processFiles}
              disabled={files.length === 0 || isProcessing}
              className="btn-primary flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Process Documents
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

// Helper to validate if a value is meaningful (not "Unknown", empty, or placeholder)
function isValidValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'string') return true;
  const lowerValue = value.toLowerCase().trim();
  return lowerValue !== '' && 
         lowerValue !== 'unknown' && 
         lowerValue !== 'n/a' && 
         lowerValue !== 'tbd' &&
         lowerValue !== 'null' &&
         !lowerValue.includes('unknown');
}

// Helper to validate ISO date format
function isValidISODate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  // Check if year seems reasonable (between 2020 and 2030)
  const year = date.getFullYear();
  return year >= 2020 && year <= 2030;
}

async function saveExtractedData(tripId: string, parsedData: any) {
  const { type, data, confidence } = parsedData;

  // Don't save if confidence is too low or data is essentially empty
  if (confidence < 0.3) {
    console.log('Skipping save: confidence too low', confidence);
    return;
  }

  try {
    switch (type) {
      case 'flight':
        // Validate we have meaningful flight info (not just "Unknown" values)
        const hasValidAirline = isValidValue(data.airline);
        const hasValidFlightNumber = isValidValue(data.flightNumber);
        const hasValidDepartureCode = isValidValue(data.departureAirportCode);
        const hasValidArrivalCode = isValidValue(data.arrivalAirportCode);
        const hasValidDepartureTime = isValidISODate(data.departureTime);
        const hasValidArrivalTime = isValidISODate(data.arrivalTime);
        
        const hasFlightInfo = hasValidAirline || hasValidFlightNumber || hasValidDepartureCode || hasValidArrivalCode;
        const hasTimes = hasValidDepartureTime && hasValidArrivalTime;
        
        if (!hasFlightInfo || !hasTimes) {
          console.log('Skipping flight save: missing valid flight information or times', { 
            hasFlightInfo, 
            hasTimes,
            airline: data.airline,
            flightNumber: data.flightNumber,
            departureTime: data.departureTime,
            arrivalTime: data.arrivalTime
          });
          return;
        }
        
        await fetch(`/api/trips/${tripId}/flights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            airline: isValidValue(data.airline) ? data.airline : (isValidValue(data.departureAirportCode) ? data.departureAirportCode : 'Airline TBD'),
            flightNumber: isValidValue(data.flightNumber) ? data.flightNumber : '',
            pnr: isValidValue(data.pnr) ? data.pnr : null,
            departureCity: isValidValue(data.departureCity) ? data.departureCity : (isValidValue(data.departureAirportCode) ? data.departureAirportCode : ''),
            departureAirport: isValidValue(data.departureAirport) ? data.departureAirport : null,
            departureAirportCode: isValidValue(data.departureAirportCode) ? data.departureAirportCode : null,
            departureTerminal: isValidValue(data.departureTerminal) ? data.departureTerminal : null,
            departureTime: data.departureTime,
            arrivalCity: isValidValue(data.arrivalCity) ? data.arrivalCity : (isValidValue(data.arrivalAirportCode) ? data.arrivalAirportCode : ''),
            arrivalAirport: isValidValue(data.arrivalAirport) ? data.arrivalAirport : null,
            arrivalAirportCode: isValidValue(data.arrivalAirportCode) ? data.arrivalAirportCode : null,
            arrivalTerminal: isValidValue(data.arrivalTerminal) ? data.arrivalTerminal : null,
            arrivalTime: data.arrivalTime,
            seatNumber: isValidValue(data.seatNumber) ? data.seatNumber : null,
            cabinClass: isValidValue(data.cabinClass) ? data.cabinClass : null,
            bookingRef: isValidValue(data.bookingRef) ? data.bookingRef : (isValidValue(data.pnr) ? data.pnr : null),
            baggageAllowance: isValidValue(data.baggageAllowance) ? data.baggageAllowance : null,
          }),
        });
        break;

      case 'hotel':
        // Only save hotel if we have meaningful data (name/address AND dates)
        const hasHotelInfo = data.name || data.address || data.city;
        const hasDates = data.checkIn && data.checkOut;
        
        if (!hasHotelInfo || !hasDates) {
          console.log('Skipping hotel save: missing hotel information or dates', { hasHotelInfo, hasDates });
          return;
        }
        
        await fetch(`/api/trips/${tripId}/hotels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name || 'Hotel TBD',
            address: data.address || '',
            city: data.city,
            checkIn: data.checkIn || null,
            checkOut: data.checkOut || null,
            checkInTime: data.checkInTime,
            checkOutTime: data.checkOutTime,
            roomType: data.roomType,
            numberOfRooms: data.numberOfRooms || 1,
            bookingRef: data.bookingRef,
            confirmationNumber: data.confirmationNumber,
            contactPhone: data.contactPhone,
            contactEmail: data.contactEmail,
            cancellationPolicy: data.cancellationPolicy,
            totalCost: data.totalCost,
            currency: data.currency,
            amenities: data.amenities ? JSON.stringify(data.amenities) : null,
          }),
        });
        break;

      case 'visa':
        // Save as visa checklist items
        await fetch(`/api/trips/${tripId}/visa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [
              {
                item: `Visa: ${data.visaType || 'Travel Visa'}`,
                description: `Valid until ${data.expiryDate || 'N/A'}. Entry: ${data.entryType || 'N/A'}`,
                category: 'document',
                isCompleted: true,
                priority: 'critical',
              },
            ],
          }),
        });
        break;
    }
  } catch (error) {
    console.error('Error saving extracted data:', error);
  }
}
