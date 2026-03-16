'use client';

import { useState } from 'react';
import {
  Smartphone,
  Plus,
  Check,
  Trash2,
  ExternalLink,
  Sparkles,
  MapPin,
  CreditCard,
  MessageSquare,
  Car,
  Utensils,
  Shield,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AppsSectionProps {
  trip: any;
  onUpdate: () => void;
}

const CATEGORIES = [
  { id: 'navigation', label: 'Navigation', icon: MapPin, color: 'bg-blue-500' },
  { id: 'transport', label: 'Transport', icon: Car, color: 'bg-purple-500' },
  { id: 'payment', label: 'Payment', icon: CreditCard, color: 'bg-green-500' },
  { id: 'translation', label: 'Translation', icon: Globe, color: 'bg-amber-500' },
  { id: 'food', label: 'Food Delivery', icon: Utensils, color: 'bg-orange-500' },
  { id: 'communication', label: 'Communication', icon: MessageSquare, color: 'bg-cyan-500' },
  { id: 'emergency', label: 'Emergency', icon: Shield, color: 'bg-red-500' },
  { id: 'other', label: 'Other', icon: Smartphone, color: 'bg-slate-500' },
];

export default function AppsSection({ trip, onUpdate }: AppsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'navigation',
    description: '',
    appStoreUrl: '',
    playStoreUrl: '',
    notes: '',
  });

  const apps = trip.apps || [];
  const installedCount = apps.filter((a: any) => a.isInstalled).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const res = await fetch(`/api/trips/${trip.id}/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('App added');
      setFormData({
        name: '',
        category: 'navigation',
        description: '',
        appStoreUrl: '',
        playStoreUrl: '',
        notes: '',
      });
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to add app');
    }
  };

  const toggleInstalled = async (app: any) => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/apps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: app.id, isInstalled: !app.isInstalled }),
      });

      if (!res.ok) throw new Error('Failed to update');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const deleteApp = async (id: string) => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/apps?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const generateApps = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'country_apps' }),
      });

      if (!res.ok) throw new Error('Failed to generate');
      toast.success('App recommendations generated!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to generate recommendations');
    } finally {
      setIsGenerating(false);
    }
  };

  const groupedApps = CATEGORIES.map((cat) => ({
    ...cat,
    apps: apps.filter((a: any) => a.category === cat.id),
  })).filter((cat) => cat.apps.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Essential Apps
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Apps to install for {trip.destination}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateApps}
            disabled={isGenerating}
            className="btn-accent flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'AI Recommend'}
          </button>
          <button onClick={() => setIsAdding(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add App
          </button>
        </div>
      </div>

      {/* Progress */}
      {apps.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Installation Progress
            </span>
            <span className="text-sm text-slate-500">
              {installedCount} of {apps.length} installed
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${apps.length > 0 ? (installedCount / apps.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Add App</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  App Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Google Maps"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input w-full"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  placeholder="What is this app for?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  App Store URL
                </label>
                <input
                  type="url"
                  value={formData.appStoreUrl}
                  onChange={(e) => setFormData({ ...formData, appStoreUrl: e.target.value })}
                  className="input w-full"
                  placeholder="iOS App Store link"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Play Store URL
                </label>
                <input
                  type="url"
                  value={formData.playStoreUrl}
                  onChange={(e) => setFormData({ ...formData, playStoreUrl: e.target.value })}
                  className="input w-full"
                  placeholder="Google Play Store link"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">Add App</button>
            </div>
          </form>
        </div>
      )}

      {/* Apps List */}
      {apps.length === 0 ? (
        <div className="card p-12 text-center">
          <Smartphone className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No apps recommended yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Get AI recommendations for essential apps in {trip.country}
          </p>
          <button onClick={generateApps} disabled={isGenerating} className="btn-primary">
            <Sparkles className="w-4 h-4 mr-2" />
            Get Recommendations
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedApps.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">{category.label}</h3>
                  <span className="text-sm text-slate-500">({category.apps.length})</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {category.apps.map((app: any) => (
                    <div
                      key={app.id}
                      className={`card p-4 transition-all ${
                        app.isInstalled ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-800 dark:text-white">{app.name}</h4>
                          {app.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {app.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleInstalled(app)}
                            className={`p-2 rounded-lg transition-colors ${
                              app.isInstalled
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'
                            }`}
                            title={app.isInstalled ? 'Mark as not installed' : 'Mark as installed'}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteApp(app.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        {app.appStoreUrl && (
                          <a
                            href={app.appStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          >
                            App Store
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {app.playStoreUrl && (
                          <a
                            href={app.playStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          >
                            Play Store
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {app.isInstalled && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Installed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
