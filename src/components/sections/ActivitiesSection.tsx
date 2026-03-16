'use client';

import { useState } from 'react';
import { Calendar, Plus, MapPin, Clock, AlertTriangle, Check, X, Sparkles } from 'lucide-react';
import { formatDateTime, formatCurrency, COUNTRY_DATA } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ActivitiesSectionProps {
  trip: any;
  onUpdate: () => void;
}

const CATEGORIES = [
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'relaxation', label: 'Relaxation' },
];

export default function ActivitiesSection({ trip, onUpdate }: ActivitiesSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    dateTime: '',
    duration: '',
    price: '',
    category: 'sightseeing',
    bookingUrl: '',
    notes: '',
  });

  const countryData = COUNTRY_DATA[trip.country] || { currency: 'USD' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/trips/${trip.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          duration: formData.duration ? parseInt(formData.duration) : null,
          price: formData.price ? parseFloat(formData.price) : null,
          currency: countryData.currency,
        }),
      });

      if (res.ok) {
        toast.success('Activity added!');
        setShowForm(false);
        setFormData({
          name: '',
          description: '',
          location: '',
          dateTime: '',
          duration: '',
          price: '',
          category: 'sightseeing',
          bookingUrl: '',
          notes: '',
        });
        onUpdate();
      } else {
        toast.error('Failed to add activity');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'activities' }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('AI suggestions generated!');
        onUpdate();
      } else {
        toast.error('Failed to generate suggestions');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleActivityStatus = async (activity: any) => {
    const newStatus = activity.status === 'completed' ? 'planned' : 'completed';
    try {
      const res = await fetch(`/api/trips/${trip.id}/activities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activity.id, status: newStatus }),
      });

      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      toast.error('Failed to update activity');
    }
  };

  const groupedActivities = trip.activities?.reduce((groups: any, activity: any) => {
    const date = new Date(activity.dateTime).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary-500" />
          Activities
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateSuggestions}
            disabled={isGenerating}
            className="btn-accent flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'AI Suggest'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </button>
        </div>
      </div>

      {/* Activities List */}
      {trip.activities?.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedActivities || {}).map(([date, activities]: [string, any]) => (
            <div key={date}>
              <h3 className="font-medium text-slate-600 dark:text-slate-300 mb-3">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <div className="space-y-3">
                {activities.map((activity: any) => (
                  <div
                    key={activity.id}
                    className={`card p-4 ${
                      activity.status === 'completed' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleActivityStatus(activity)}
                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          activity.status === 'completed'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 hover:border-primary-500'
                        }`}
                      >
                        {activity.status === 'completed' && <Check className="w-4 h-4" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className={`font-semibold text-slate-800 dark:text-white ${
                              activity.status === 'completed' ? 'line-through' : ''
                            }`}>
                              {activity.name}
                            </h4>
                            {activity.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <span className={`badge ${
                            activity.category === 'sightseeing' ? 'badge-info' :
                            activity.category === 'adventure' ? 'badge-warning' :
                            activity.category === 'food' ? 'badge-success' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {activity.category}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(activity.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {activity.location}
                          </span>
                          {activity.duration && (
                            <span>{Math.round(activity.duration / 60)}h</span>
                          )}
                          {activity.price && (
                            <span>{formatCurrency(activity.price, activity.currency)}</span>
                          )}
                          {activity.isPeakHour && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <AlertTriangle className="w-4 h-4" />
                              Peak hours
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No activities planned yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Plan your activities or let AI suggest some for you
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleGenerateSuggestions}
              disabled={isGenerating}
              className="btn-accent inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Get AI Suggestions
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Manually
            </button>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Add Activity
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Activity Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Location</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input-field"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="input-field"
                    value={formData.dateTime}
                    onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Duration (minutes)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price ({countryData.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Booking URL</label>
                  <input
                    type="url"
                    className="input-field"
                    value={formData.bookingUrl}
                    onChange={(e) => setFormData({ ...formData, bookingUrl: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? 'Adding...' : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
