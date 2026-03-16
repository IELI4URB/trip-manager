'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plane,
  Hotel,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  FileCheck,
  CreditCard,
  Luggage,
  UtensilsCrossed,
  Smartphone,
  Car,
  ChevronRight,
  Upload,
  Plus,
  Check,
  X,
  AlertCircle,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, formatDateTime, getDaysUntil, formatCurrency, COUNTRY_DATA } from '@/lib/utils';

// Components
import FlightsSection from '@/components/sections/FlightsSection';
import HotelsSection from '@/components/sections/HotelsSection';
import ActivitiesSection from '@/components/sections/ActivitiesSection';
import VisaSection from '@/components/sections/VisaSection';
import MoneySection from '@/components/sections/MoneySection';
import EssentialsSection from '@/components/sections/EssentialsSection';
import FoodSection from '@/components/sections/FoodSection';
import ExpensesSection from '@/components/sections/ExpensesSection';
import AppsSection from '@/components/sections/AppsSection';
import TransportSection from '@/components/sections/TransportSection';
import AIAssistant from '@/components/AIAssistant';
import DocumentUploader from '@/components/DocumentUploader';

interface TripPageProps {
  params: { id: string };
}

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: MapPin },
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'hotels', label: 'Hotels', icon: Hotel },
  { id: 'activities', label: 'Activities', icon: Calendar },
  { id: 'visa', label: 'Visa Checklist', icon: FileCheck },
  { id: 'money', label: 'Money & Cards', icon: CreditCard },
  { id: 'essentials', label: 'Essentials', icon: Luggage },
  { id: 'food', label: 'Food & Dining', icon: UtensilsCrossed },
  { id: 'expenses', label: 'Expenses', icon: DollarSign },
  { id: 'apps', label: 'Apps', icon: Smartphone },
  { id: 'transport', label: 'Transport', icon: Car },
];

export default function TripPage({ params }: TripPageProps) {
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [showUploader, setShowUploader] = useState(false);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    fetchTrip();
  }, [params.id]);

  const fetchTrip = async () => {
    try {
      const res = await fetch(`/api/trips/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setTrip(data);
      } else {
        toast.error('Trip not found');
        router.push('/');
      }
    } catch (error) {
      toast.error('Failed to load trip');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return null;
  }

  const daysUntil = getDaysUntil(trip.startDate);
  const countryData = COUNTRY_DATA[trip.country] || { name: trip.country, currency: 'USD' };

  const renderSection = () => {
    const sectionProps = { trip, onUpdate: fetchTrip };

    switch (activeSection) {
      case 'flights':
        return <FlightsSection {...sectionProps} />;
      case 'hotels':
        return <HotelsSection {...sectionProps} />;
      case 'activities':
        return <ActivitiesSection {...sectionProps} />;
      case 'visa':
        return <VisaSection {...sectionProps} />;
      case 'money':
        return <MoneySection {...sectionProps} />;
      case 'essentials':
        return <EssentialsSection {...sectionProps} />;
      case 'food':
        return <FoodSection {...sectionProps} />;
      case 'expenses':
        return <ExpensesSection {...sectionProps} />;
      case 'apps':
        return <AppsSection {...sectionProps} />;
      case 'transport':
        return <TransportSection {...sectionProps} />;
      default:
        return <OverviewSection trip={trip} setActiveSection={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                  {trip.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                  {trip.destination}, {countryData.name}
                  <span className="mx-2">•</span>
                  <Clock className="w-4 h-4" />
                  {daysUntil > 0 ? `${daysUntil} days away` : daysUntil === 0 ? 'Today!' : 'In progress'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUploader(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </button>
              <button
                onClick={() => setShowAI(true)}
                className="btn-accent flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI Assistant</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="card p-4 sticky top-24">
              <ul className="space-y-1">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full ${isActive ? 'sidebar-link-active' : 'sidebar-link'}`}
                      >
                        <Icon className="w-5 h-5" />
                        {section.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-30">
            <div className="flex overflow-x-auto py-2 px-4 gap-2">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0 pb-24 lg:pb-0">
            {renderSection()}
          </main>
        </div>
      </div>

      {/* Document Uploader Modal */}
      {showUploader && (
        <DocumentUploader
          tripId={trip.id}
          onClose={() => setShowUploader(false)}
          onSuccess={fetchTrip}
        />
      )}

      {/* AI Assistant Modal */}
      {showAI && (
        <AIAssistant
          trip={trip}
          onClose={() => setShowAI(false)}
          onUpdate={fetchTrip}
        />
      )}
    </div>
  );
}

function OverviewSection({ trip, setActiveSection }: { trip: any; setActiveSection: (s: string) => void }) {
  const countryData = COUNTRY_DATA[trip.country] || { name: trip.country, currency: 'USD' };

  // Calculate progress
  const totalFlights = trip.flights?.length || 0;
  const totalHotels = trip.hotels?.length || 0;
  const visaProgress = trip.visaChecklist?.length
    ? Math.round((trip.visaChecklist.filter((v: any) => v.isCompleted).length / trip.visaChecklist.length) * 100)
    : 0;
  const essentialsProgress = trip.essentials?.length
    ? Math.round((trip.essentials.filter((e: any) => e.isPacked).length / trip.essentials.length) * 100)
    : 0;
  const totalExpenses = trip.expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Trip Summary Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              {trip.name}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {trip.destination}, {countryData.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                {countryData.currency}
              </span>
            </div>
          </div>
          <span className={`badge ${
            trip.status === 'active' ? 'badge-success' :
            trip.status === 'upcoming' ? 'badge-info' :
            trip.status === 'planning' ? 'badge-warning' :
            'bg-slate-100 text-slate-600'
          }`}>
            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
          </span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Flights"
            value={totalFlights}
            icon={<Plane className="w-5 h-5" />}
            onClick={() => setActiveSection('flights')}
          />
          <StatCard
            label="Hotels"
            value={totalHotels}
            icon={<Hotel className="w-5 h-5" />}
            onClick={() => setActiveSection('hotels')}
          />
          <StatCard
            label="Visa Ready"
            value={`${visaProgress}%`}
            icon={<FileCheck className="w-5 h-5" />}
            onClick={() => setActiveSection('visa')}
          />
          <StatCard
            label="Packed"
            value={`${essentialsProgress}%`}
            icon={<Luggage className="w-5 h-5" />}
            onClick={() => setActiveSection('essentials')}
          />
        </div>
      </div>

      {/* Upcoming Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Flight */}
        {trip.flights?.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Plane className="w-5 h-5 text-primary-500" />
                Next Flight
              </h3>
              <button
                onClick={() => setActiveSection('flights')}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                View all
              </button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <p className="font-medium text-slate-800 dark:text-white">
                {trip.flights[0].airline} - {trip.flights[0].flightNumber}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {trip.flights[0].departureCity} → {trip.flights[0].arrivalCity}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                {formatDateTime(trip.flights[0].departureTime)}
              </p>
            </div>
          </div>
        )}

        {/* Hotel */}
        {trip.hotels?.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Hotel className="w-5 h-5 text-primary-500" />
                Accommodation
              </h3>
              <button
                onClick={() => setActiveSection('hotels')}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                View all
              </button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <p className="font-medium text-slate-800 dark:text-white">
                {trip.hotels[0].name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {trip.hotels[0].address}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Check-in: {formatDate(trip.hotels[0].checkIn)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expenses Summary */}
      {totalExpenses > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-500" />
              Total Expenses
            </h3>
            <button
              onClick={() => setActiveSection('expenses')}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              View details
            </button>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">
            {formatCurrency(totalExpenses, trip.expenses[0]?.currency || 'USD')}
          </p>
        </div>
      )}

      {/* AI Suggestions */}
      {trip.aiSuggestions?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent-500" />
            AI Suggestions
          </h3>
          <div className="space-y-3">
            {trip.aiSuggestions.slice(0, 3).map((suggestion: any) => (
              <div
                key={suggestion.id}
                className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg p-4"
              >
                <p className="font-medium text-slate-800 dark:text-white">
                  {suggestion.title}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                  {suggestion.content.substring(0, 150)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-left hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
    >
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
    </button>
  );
}
