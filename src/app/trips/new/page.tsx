'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plane, Calendar, MapPin, FileText, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { COUNTRY_DATA } from '@/lib/utils';

export default function NewTripPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    country: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const trip = await res.json();
        toast.success('Trip created successfully!');
        router.push(`/trips/${trip.id}`);
      } else {
        toast.error('Failed to create trip');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              Plan New Trip
            </h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
              <Plane className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                Create Your Trip
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Fill in the details and let AI help you plan
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trip Name */}
            <div>
              <label htmlFor="name" className="label">
                Trip Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g., Summer Vacation 2024"
                className="input-field"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Destination & Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="destination" className="label flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Destination City
                </label>
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  required
                  placeholder="e.g., Tokyo"
                  className="input-field"
                  value={formData.destination}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="country" className="label">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  className="input-field"
                  value={formData.country}
                  onChange={handleChange}
                >
                  <option value="">Select country</option>
                  {Object.entries(COUNTRY_DATA).map(([code, data]) => (
                    <option key={code} value={code}>
                      {data.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="label flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  className="input-field"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="label flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  required
                  className="input-field"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="label flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Any special requirements, interests, or things you want to do..."
                className="input-field resize-none"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            {/* AI Features Notice */}
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  AI-Powered Planning
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  After creating your trip, our AI will help you with visa requirements, 
                  packing lists, best times to visit attractions, and money tips.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Link href="/" className="btn-secondary flex-1 text-center">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plane className="w-5 h-5" />
                    Create Trip
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
