'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plane,
  Plus,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Sparkles,
  Globe,
  Luggage,
} from 'lucide-react';
import { formatDate, getDaysUntil } from '@/lib/utils';

interface Trip {
  id: string;
  name: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  status: string;
  coverImage?: string;
}

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await fetch('/api/trips');
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingTrips = trips.filter((t) => t.status === 'upcoming' || t.status === 'planning');
  const activeTrips = trips.filter((t) => t.status === 'active');
  const pastTrips = trips.filter((t) => t.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Trip Manager</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Travel</p>
              </div>
            </div>
            <Link
              href="/trips/new"
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Trip</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        {trips.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
              Welcome to Trip Manager
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-8">
              Your AI-powered travel companion. Upload your bookings, get smart suggestions, 
              and manage your entire trip in one place.
            </p>
            <Link href="/trips/new" className="btn-primary inline-flex items-center gap-2 text-lg px-6 py-3">
              <Plus className="w-6 h-6" />
              Plan Your First Trip
            </Link>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <FeatureCard
                icon={<Sparkles className="w-8 h-8" />}
                title="AI-Powered"
                description="Get smart suggestions for activities, avoid rush hours, and travel tips"
              />
              <FeatureCard
                icon={<Luggage className="w-8 h-8" />}
                title="All-in-One"
                description="Flights, hotels, visas, essentials, and expenses in one dashboard"
              />
              <FeatureCard
                icon={<Calendar className="w-8 h-8" />}
                title="Stay Organized"
                description="Checklists, reminders, and pre-trip preparation made easy"
              />
            </div>
          </div>
        )}

        {/* Active Trip */}
        {activeTrips.length > 0 && (
          <section className="mb-12">
            <h2 className="section-title flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              Active Trip
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {activeTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} isActive />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <section className="mb-12">
            <h2 className="section-title">Upcoming Trips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}

        {/* Past Trips */}
        {pastTrips.length > 0 && (
          <section>
            <h2 className="section-title text-slate-500">Past Trips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
              {pastTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4" />
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TripCard({ trip, isActive = false }: { trip: Trip; isActive?: boolean }) {
  const daysUntil = getDaysUntil(trip.startDate);
  const daysText = daysUntil > 0 ? `${daysUntil} days away` : daysUntil === 0 ? 'Today!' : 'In progress';

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className={`card-hover p-6 ${isActive ? 'ring-2 ring-green-500' : ''}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              {trip.name}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mt-1">
              <MapPin className="w-4 h-4" />
              {trip.destination}, {trip.country}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4" />
            {formatDate(trip.startDate)}
          </div>
          <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
            <Clock className="w-4 h-4" />
            {daysText}
          </div>
        </div>

        {isActive && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <span className="badge-success">Currently Active</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-6 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900 dark:to-accent-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600 dark:text-primary-400">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
