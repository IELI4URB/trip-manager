'use client';

import { useState } from 'react';
import {
  FileCheck,
  Plus,
  Check,
  AlertCircle,
  Calendar,
  Trash2,
  Edit2,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface VisaSectionProps {
  trip: any;
  onUpdate: () => void;
}

const CATEGORIES = [
  { id: 'document', label: 'Documents', color: 'bg-blue-500' },
  { id: 'form', label: 'Forms', color: 'bg-purple-500' },
  { id: 'appointment', label: 'Appointments', color: 'bg-green-500' },
  { id: 'financial', label: 'Financial', color: 'bg-amber-500' },
  { id: 'photo', label: 'Photo', color: 'bg-pink-500' },
  { id: 'interview', label: 'Interview', color: 'bg-red-500' },
  { id: 'other', label: 'Other', color: 'bg-slate-500' },
];

const PRIORITIES = [
  { id: 'critical', label: 'Critical', color: 'text-red-500 bg-red-50' },
  { id: 'high', label: 'High', color: 'text-orange-500 bg-orange-50' },
  { id: 'medium', label: 'Medium', color: 'text-amber-500 bg-amber-50' },
  { id: 'low', label: 'Low', color: 'text-green-500 bg-green-50' },
];

export default function VisaSection({ trip, onUpdate }: VisaSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    item: '',
    description: '',
    category: 'document',
    priority: 'medium',
    dueDate: '',
    notes: '',
  });

  const visaItems = trip.visaChecklist || [];
  const completedCount = visaItems.filter((v: any) => v.isCompleted).length;
  const progress = visaItems.length > 0 ? Math.round((completedCount / visaItems.length) * 100) : 0;

  const groupedItems = CATEGORIES.map((cat) => ({
    ...cat,
    items: visaItems.filter((v: any) => v.category === cat.id),
  })).filter((cat) => cat.items.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item.trim()) return;

    try {
      const url = editingId
        ? `/api/trips/${trip.id}/visa`
        : `/api/trips/${trip.id}/visa`;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success(editingId ? 'Item updated' : 'Item added');
      resetForm();
      onUpdate();
    } catch (error) {
      toast.error('Failed to save item');
    }
  };

  const toggleComplete = async (item: any) => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/visa`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isCompleted: !item.isCompleted }),
      });

      if (!res.ok) throw new Error('Failed to update');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;

    try {
      const res = await fetch(`/api/trips/${trip.id}/visa?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Item deleted');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const generateChecklist = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'visa_requirements',
          data: { nationality: 'US' },
        }),
      });

      if (!res.ok) throw new Error('Failed to generate');
      toast.success('Visa checklist generated!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to generate checklist');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      item: '',
      description: '',
      category: 'document',
      priority: 'medium',
      dueDate: '',
      notes: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Visa Checklist
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track your visa application requirements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateChecklist}
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
      {visaItems.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Progress
            </span>
            <span className="text-sm text-slate-500">
              {completedCount} of {visaItems.length} completed
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
            {editingId ? 'Edit Item' : 'Add New Item'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Valid Passport"
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
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input w-full"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  placeholder="Additional details"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Checklist Items */}
      {visaItems.length === 0 ? (
        <div className="card p-12 text-center">
          <FileCheck className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No visa checklist items
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Generate a checklist using AI or add items manually
          </p>
          <button
            onClick={generateChecklist}
            disabled={isGenerating}
            className="btn-primary"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedItems.map((category) => (
            <div key={category.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedCategory(
                  expandedCategory === category.id ? null : category.id
                )}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  <span className="font-medium text-slate-800 dark:text-white">
                    {category.label}
                  </span>
                  <span className="text-sm text-slate-500">
                    ({category.items.filter((i: any) => i.isCompleted).length}/{category.items.length})
                  </span>
                </div>
                {expandedCategory === category.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {(expandedCategory === category.id || expandedCategory === null) && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  {category.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                    >
                      <button
                        onClick={() => toggleComplete(item)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          item.isCompleted
                            ? 'bg-green-500 border-green-500'
                            : 'border-slate-300 dark:border-slate-600 hover:border-green-400'
                        }`}
                      >
                        {item.isCompleted && <Check className="w-4 h-4 text-white" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${
                          item.isCompleted
                            ? 'line-through text-slate-400'
                            : 'text-slate-800 dark:text-white'
                        }`}>
                          {item.item}
                        </p>
                        {item.description && (
                          <p className="text-sm text-slate-500 truncate">
                            {item.description}
                          </p>
                        )}
                        {item.dueDate && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        PRIORITIES.find((p) => p.id === item.priority)?.color || ''
                      }`}>
                        {item.priority}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setFormData({
                              item: item.item,
                              description: item.description || '',
                              category: item.category,
                              priority: item.priority,
                              dueDate: item.dueDate?.split('T')[0] || '',
                              notes: item.notes || '',
                            });
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
