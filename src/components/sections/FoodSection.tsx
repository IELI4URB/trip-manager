'use client';

import { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Check,
  Trash2,
  MapPin,
  Star,
  Sparkles,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { generateGoogleMapsLink } from '@/lib/navigation';

interface FoodSectionProps {
  trip: any;
  onUpdate: () => void;
}

const PRICE_RANGES = [
  { id: 'budget', label: 'Budget', symbol: '$' },
  { id: 'moderate', label: 'Moderate', symbol: '$$' },
  { id: 'expensive', label: 'Expensive', symbol: '$$$' },
  { id: 'luxury', label: 'Luxury', symbol: '$$$$' },
];

export default function FoodSection({ trip, onUpdate }: FoodSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    address: '',
    priceRange: 'moderate',
    rating: '',
    mustTry: '',
    notes: '',
  });

  const foodPlaces = trip.foodPlaces || [];
  const visitedCount = foodPlaces.filter((f: any) => f.isVisited).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const res = await fetch(`/api/trips/${trip.id}/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('Restaurant added');
      setFormData({
        name: '',
        cuisine: '',
        address: '',
        priceRange: 'moderate',
        rating: '',
        mustTry: '',
        notes: '',
      });
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to add');
    }
  };

  const toggleVisited = async (place: any) => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/food`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: place.id,
          isVisited: !place.isVisited,
          visitDate: !place.isVisited ? new Date().toISOString() : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const deletePlace = async (id: string) => {
    if (!confirm('Delete this restaurant?')) return;

    try {
      const res = await fetch(`/api/trips/${trip.id}/food?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Deleted');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const generateGuide = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'food_guide' }),
      });

      if (!res.ok) throw new Error('Failed to generate');
      toast.success('Food guide generated!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to generate guide');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Food & Dining
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Discover local cuisine in {trip.destination}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateGuide}
            disabled={isGenerating}
            className="btn-accent flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'AI Recommendations'}
          </button>
          <button onClick={() => setIsAdding(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Restaurant
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{foodPlaces.length}</p>
          <p className="text-sm text-slate-500">Saved Places</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{visitedCount}</p>
          <p className="text-sm text-slate-500">Visited</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{foodPlaces.length - visitedCount}</p>
          <p className="text-sm text-slate-500">To Try</p>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Add Restaurant</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="Restaurant name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cuisine
                </label>
                <input
                  type="text"
                  value={formData.cuisine}
                  onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Italian, Japanese"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input w-full"
                  placeholder="Full address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Price Range
                </label>
                <select
                  value={formData.priceRange}
                  onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                  className="input w-full"
                >
                  {PRICE_RANGES.map((range) => (
                    <option key={range.id} value={range.id}>
                      {range.symbol} - {range.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Must Try Dishes
                </label>
                <input
                  type="text"
                  value={formData.mustTry}
                  onChange={(e) => setFormData({ ...formData, mustTry: e.target.value })}
                  className="input w-full"
                  placeholder="Recommended dishes"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">Add Restaurant</button>
            </div>
          </form>
        </div>
      )}

      {/* Restaurant List */}
      {foodPlaces.length === 0 ? (
        <div className="card p-12 text-center">
          <UtensilsCrossed className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No restaurants saved yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Get AI recommendations or add restaurants manually
          </p>
          <button onClick={generateGuide} disabled={isGenerating} className="btn-primary">
            <Sparkles className="w-4 h-4 mr-2" />
            Get Recommendations
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {foodPlaces.map((place: any) => {
            const priceInfo = PRICE_RANGES.find((p) => p.id === place.priceRange) || PRICE_RANGES[1];

            return (
              <div
                key={place.id}
                className={`card p-5 transition-all ${
                  place.isVisited ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                      {place.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{place.cuisine}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleVisited(place)}
                      className={`p-2 rounded-lg transition-colors ${
                        place.isVisited
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'
                      }`}
                      title={place.isVisited ? 'Mark as not visited' : 'Mark as visited'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePlace(place.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {priceInfo.symbol}
                  </span>
                  {place.rating && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      <Star className="w-3 h-3 fill-current" />
                      {place.rating}
                    </span>
                  )}
                  {place.isVisited && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Visited
                    </span>
                  )}
                </div>

                {place.mustTry && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                    <span className="font-medium">Must try:</span> {place.mustTry}
                  </p>
                )}

                {place.address && (
                  <a
                    href={generateGoogleMapsLink(place.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{place.address}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
