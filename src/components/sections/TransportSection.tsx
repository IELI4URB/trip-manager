'use client';

import { useState } from 'react';
import {
  Car,
  Plus,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  Train,
  Bus,
  TrendingDown,
  Navigation,
  ExternalLink,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TransportSectionProps {
  trip: any;
  onUpdate: () => void;
}

const TRANSPORT_TYPES = [
  { id: 'taxi', label: 'Taxi/Ride-hail', icon: Car },
  { id: 'shuttle', label: 'Airport Shuttle', icon: Bus },
  { id: 'train', label: 'Train', icon: Train },
  { id: 'metro', label: 'Metro/Subway', icon: Train },
  { id: 'bus', label: 'Public Bus', icon: Bus },
  { id: 'private', label: 'Private Transfer', icon: Car },
  { id: 'rental', label: 'Car Rental', icon: Car },
];

export default function TransportSection({ trip, onUpdate }: TransportSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    type: 'taxi',
    name: '',
    from: '',
    to: '',
    estimatedCost: '',
    duration: '',
    bookingUrl: '',
    notes: '',
    isBooked: false,
  });

  const transports = trip.transports || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.from.trim() || !formData.to.trim()) return;

    try {
      const res = await fetch(`/api/trips/${trip.id}/transport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
          duration: formData.duration ? parseInt(formData.duration) : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('Transport option added');
      setFormData({
        type: 'taxi',
        name: '',
        from: '',
        to: '',
        estimatedCost: '',
        duration: '',
        bookingUrl: '',
        notes: '',
        isBooked: false,
      });
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to add transport');
    }
  };

  const deleteTransport = async (id: string) => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/transport?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const generateOptions = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transport_options',
          data: {
            from: trip.hotels?.[0]?.name || 'Airport',
            to: trip.destination,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to generate');
      toast.success('Transport options generated!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to generate options');
    } finally {
      setIsGenerating(false);
    }
  };

  const openInMaps = (from: string, to: string) => {
    const url = `https://www.google.com/maps/dir/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
    window.open(url, '_blank');
  };

  const getTypeInfo = (typeId: string) => {
    return TRANSPORT_TYPES.find((t) => t.id === typeId) || TRANSPORT_TYPES[0];
  };

  // Group by route (from -> to)
  const routes = transports.reduce((acc: any, t: any) => {
    const key = `${t.from} → ${t.to}`;
    if (!acc[key]) {
      acc[key] = { from: t.from, to: t.to, options: [] };
    }
    acc[key].options.push(t);
    return acc;
  }, {});

  const sortedRoutes = Object.values(routes) as any[];

  // Find cheapest option per route
  const getCheapest = (options: any[]) => {
    const withCost = options.filter((o) => o.estimatedCost);
    if (withCost.length === 0) return null;
    return withCost.reduce((min, o) => (o.estimatedCost < min.estimatedCost ? o : min));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Transport Options
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Compare ways to get around in {trip.destination}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateOptions}
            disabled={isGenerating}
            className="btn-accent flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'AI Compare'}
          </button>
          <button onClick={() => setIsAdding(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Option
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {transports.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {sortedRoutes.length}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Routes</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {transports.length}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Options</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {transports.filter((t: any) => t.isBooked).length}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Booked</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {transports.filter((t: any) => t.bookingUrl).length}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Bookable</p>
          </div>
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Add Transport Option</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input w-full"
                >
                  {TRANSPORT_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Uber to Airport"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  From *
                </label>
                <input
                  type="text"
                  value={formData.from}
                  onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Airport"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  To *
                </label>
                <input
                  type="text"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Hotel"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Cost (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                  className="input w-full"
                  placeholder="25.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="input w-full"
                  placeholder="45"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Booking URL
                </label>
                <input
                  type="url"
                  value={formData.bookingUrl}
                  onChange={(e) => setFormData({ ...formData, bookingUrl: e.target.value })}
                  className="input w-full"
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="Tips or instructions..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">Add Transport</button>
            </div>
          </form>
        </div>
      )}

      {/* Routes List */}
      {transports.length === 0 ? (
        <div className="card p-12 text-center">
          <Car className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No transport options added
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Compare different ways to get around
          </p>
          <button onClick={() => setIsAdding(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add First Option
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedRoutes.map((route: any, index) => {
            const cheapest = getCheapest(route.options);

            return (
              <div key={index} className="card overflow-hidden">
                {/* Route Header */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-slate-800 dark:text-white">{route.from}</span>
                    </div>
                    <span className="text-slate-400">→</span>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-slate-800 dark:text-white">{route.to}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openInMaps(route.from, route.to)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  >
                    <Navigation className="w-3 h-3" />
                    View Route
                  </button>
                </div>

                {/* Options */}
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {route.options.map((option: any) => {
                    const typeInfo = getTypeInfo(option.type);
                    const Icon = typeInfo.icon;
                    const isCheapest = cheapest && cheapest.id === option.id && route.options.length > 1;

                    return (
                      <div key={option.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800 dark:text-white">
                                {typeInfo.label}
                              </span>
                              {option.isBooked && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  <Check className="w-3 h-3" />
                                  Booked
                                </span>
                              )}
                              {isCheapest && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  <TrendingDown className="w-3 h-3" />
                                  Cheapest
                                </span>
                              )}
                            </div>
                            {option.notes && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {option.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {option.duration && (
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span className="font-medium">{option.duration} min</span>
                              </div>
                            </div>
                          )}
                          {option.estimatedCost && (
                            <div className="text-center min-w-[60px]">
                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                <DollarSign className="w-4 h-4 text-slate-400" />
                                <span className={`font-medium ${isCheapest ? 'text-green-600 dark:text-green-400' : ''}`}>
                                  {option.estimatedCost.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            {option.bookingUrl && (
                              <a
                                href={option.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-500"
                                title="Book now"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => deleteTransport(option.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
