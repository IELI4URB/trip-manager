'use client';

import { useState } from 'react';
import {
  Luggage,
  Plus,
  Check,
  Trash2,
  Package,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plug,
  Shirt,
  Pill,
  FileText,
  Smartphone,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { COUNTRY_DATA } from '@/lib/utils';

interface EssentialsSectionProps {
  trip: any;
  onUpdate: () => void;
}

const CATEGORIES = [
  { id: 'documents', label: 'Documents', icon: FileText, color: 'bg-blue-500' },
  { id: 'electronics', label: 'Electronics', icon: Smartphone, color: 'bg-purple-500' },
  { id: 'clothing', label: 'Clothing', icon: Shirt, color: 'bg-pink-500' },
  { id: 'toiletries', label: 'Toiletries', icon: ShoppingBag, color: 'bg-green-500' },
  { id: 'medicine', label: 'Medicine', icon: Pill, color: 'bg-red-500' },
  { id: 'accessories', label: 'Accessories', icon: Package, color: 'bg-amber-500' },
  { id: 'other', label: 'Other', icon: Package, color: 'bg-slate-500' },
];

export default function EssentialsSection({ trip, onUpdate }: EssentialsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    item: '',
    category: 'electronics',
    quantity: 1,
    isEssential: true,
    notes: '',
  });

  const essentials = trip.essentials || [];
  const packedCount = essentials.filter((e: any) => e.isPacked).length;
  const progress = essentials.length > 0 ? Math.round((packedCount / essentials.length) * 100) : 0;
  const countryData = COUNTRY_DATA[trip.country] || {};

  const groupedItems = CATEGORIES.map((cat) => ({
    ...cat,
    items: essentials.filter((e: any) => e.category === cat.id),
  })).filter((cat) => cat.items.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item.trim()) return;

    try {
      const res = await fetch(`/api/trips/${trip.id}/essentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('Item added');
      setFormData({ item: '', category: 'electronics', quantity: 1, isEssential: true, notes: '' });
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const togglePacked = async (item: any) => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/essentials`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isPacked: !item.isPacked }),
      });

      if (!res.ok) throw new Error('Failed to update');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/essentials?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const generateList = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'packing_checklist' }),
      });

      if (!res.ok) throw new Error('Failed to generate');
      toast.success('Packing list generated!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to generate list');
    } finally {
      setIsGenerating(false);
    }
  };

  const packAll = async (categoryId: string) => {
    const categoryItems = essentials.filter((e: any) => e.category === categoryId && !e.isPacked);
    for (const item of categoryItems) {
      await togglePacked(item);
    }
    onUpdate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Travel Essentials
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Packing checklist for {trip.destination}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateList}
            disabled={isGenerating}
            className="btn-accent flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'AI Generate'}
          </button>
          <button onClick={() => setIsAdding(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Progress */}
      {essentials.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Packing Progress
            </span>
            <span className="text-sm text-slate-500">
              {packedCount} of {essentials.length} packed
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress === 100 ? 'bg-green-500' : 'bg-primary-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
              <Check className="w-4 h-4" />
              All packed! You're ready to go! 🎉
            </p>
          )}
        </div>
      )}

      {/* Country-specific info */}
      {countryData.plugType && (
        <div className="card p-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Plug className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {trip.country} uses plug type: <strong>{countryData.plugType}</strong>
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Voltage: {countryData.voltage}. Make sure to bring the right adapter!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Add Item</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Universal Power Adapter"
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
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="input w-full"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isEssential}
                    onChange={(e) => setFormData({ ...formData, isEssential: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Essential item</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">Add Item</button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      {essentials.length === 0 ? (
        <div className="card p-12 text-center">
          <Luggage className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No packing items yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Generate a packing list with AI or add items manually
          </p>
          <button onClick={generateList} disabled={isGenerating} className="btn-primary">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Packing List
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedItems.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedCategory === category.id || expandedCategory === null;
            const categoryPacked = category.items.filter((i: any) => i.isPacked).length;

            return (
              <div key={category.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  )}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {category.label}
                    </span>
                    <span className={`text-sm ${
                      categoryPacked === category.items.length
                        ? 'text-green-500'
                        : 'text-slate-500'
                    }`}>
                      ({categoryPacked}/{category.items.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {categoryPacked < category.items.length && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          packAll(category.id);
                        }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Pack All
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/50">
                    {category.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                      >
                        <button
                          onClick={() => togglePacked(item)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            item.isPacked
                              ? 'bg-green-500 border-green-500'
                              : 'border-slate-300 dark:border-slate-600 hover:border-green-400'
                          }`}
                        >
                          {item.isPacked && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${
                            item.isPacked
                              ? 'line-through text-slate-400'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}>
                            {item.item}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-xs text-slate-400 ml-2">×{item.quantity}</span>
                          )}
                        </div>
                        {item.isEssential && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            Essential
                          </span>
                        )}
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
