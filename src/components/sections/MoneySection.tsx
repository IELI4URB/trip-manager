'use client';

import { useState } from 'react';
import {
  CreditCard,
  Plus,
  Check,
  Trash2,
  Edit2,
  AlertCircle,
  DollarSign,
  Wallet,
  Building2,
  Banknote,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, COUNTRY_DATA } from '@/lib/utils';

interface MoneySectionProps {
  trip: any;
  onUpdate: () => void;
}

const CARD_TYPES = [
  { id: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { id: 'debit_card', label: 'Debit Card', icon: CreditCard },
  { id: 'forex_card', label: 'Forex Card', icon: Wallet },
  { id: 'travel_card', label: 'Travel Card', icon: Wallet },
  { id: 'cash', label: 'Cash', icon: Banknote },
];

const CARD_NETWORKS = ['visa', 'mastercard', 'amex', 'rupay', 'other'];

export default function MoneySection({ trip, onUpdate }: MoneySectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    type: 'credit_card',
    name: '',
    lastFourDigits: '',
    bankName: '',
    expiryDate: '',
    cardNetwork: 'visa',
    isNotified: false,
    isActivated: false,
    limit: '',
    currency: '',
    foreignTxnFee: '',
    notes: '',
  });

  const moneyCards = trip.moneyCards || [];
  const countryData = COUNTRY_DATA[trip.country] || { currency: 'USD' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const url = `/api/trips/${trip.id}/money`;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success(editingId ? 'Card updated' : 'Card added');
      resetForm();
      onUpdate();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const toggleField = async (card: any, field: 'isNotified' | 'isActivated') => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/money`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: card.id, [field]: !card[field] }),
      });

      if (!res.ok) throw new Error('Failed to update');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const deleteCard = async (id: string) => {
    if (!confirm('Delete this card/payment method?')) return;

    try {
      const res = await fetch(`/api/trips/${trip.id}/money?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Deleted');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const generateAdvice = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'money' }),
      });

      if (!res.ok) throw new Error('Failed to generate');
      toast.success('Money advice generated!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to generate advice');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'credit_card',
      name: '',
      lastFourDigits: '',
      bankName: '',
      expiryDate: '',
      cardNetwork: 'visa',
      isNotified: false,
      isActivated: false,
      limit: '',
      currency: '',
      foreignTxnFee: '',
      notes: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const notifiedCount = moneyCards.filter((c: any) => c.isNotified).length;
  const activatedCount = moneyCards.filter((c: any) => c.isActivated).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Money & Cards
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your payment methods for {trip.destination}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateAdvice}
            disabled={isGenerating}
            className="btn-accent flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            AI Advice
          </button>
          <button onClick={() => setIsAdding(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{moneyCards.length}</p>
              <p className="text-xs text-slate-500">Total Cards</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{notifiedCount}</p>
              <p className="text-xs text-slate-500">Bank Notified</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{activatedCount}</p>
              <p className="text-xs text-slate-500">Intl. Active</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{countryData.currency}</p>
              <p className="text-xs text-slate-500">Local Currency</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
            {editingId ? 'Edit Payment Method' : 'Add Payment Method'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input w-full"
                >
                  {CARD_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Chase Sapphire"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Last 4 Digits
                </label>
                <input
                  type="text"
                  value={formData.lastFourDigits}
                  onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value.slice(0, 4) })}
                  className="input w-full"
                  placeholder="1234"
                  maxLength={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Chase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Card Network
                </label>
                <select
                  value={formData.cardNetwork}
                  onChange={(e) => setFormData({ ...formData, cardNetwork: e.target.value })}
                  className="input w-full"
                >
                  {CARD_NETWORKS.map((network) => (
                    <option key={network} value={network} className="capitalize">{network}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Foreign Txn Fee (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.foreignTxnFee}
                  onChange={(e) => setFormData({ ...formData, foreignTxnFee: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., 2.5"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isNotified}
                  onChange={(e) => setFormData({ ...formData, isNotified: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Bank notified about travel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActivated}
                  onChange={(e) => setFormData({ ...formData, isActivated: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">International transactions enabled</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Add Card'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cards List */}
      {moneyCards.length === 0 ? (
        <div className="card p-12 text-center">
          <Wallet className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No payment methods added
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Add your cards and payment methods for your trip
          </p>
          <button onClick={() => setIsAdding(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {moneyCards.map((card: any) => {
            const typeInfo = CARD_TYPES.find((t) => t.id === card.type) || CARD_TYPES[0];
            const Icon = typeInfo.icon;

            return (
              <div key={card.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">
                          {card.name}
                          {card.lastFourDigits && (
                            <span className="text-slate-400 font-normal"> •••• {card.lastFourDigits}</span>
                          )}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {card.bankName && `${card.bankName} • `}
                          {typeInfo.label}
                          {card.cardNetwork && ` • ${card.cardNetwork.toUpperCase()}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(card.id);
                            setFormData({
                              type: card.type,
                              name: card.name,
                              lastFourDigits: card.lastFourDigits || '',
                              bankName: card.bankName || '',
                              expiryDate: card.expiryDate || '',
                              cardNetwork: card.cardNetwork || 'visa',
                              isNotified: card.isNotified,
                              isActivated: card.isActivated,
                              limit: card.limit?.toString() || '',
                              currency: card.currency || '',
                              foreignTxnFee: card.foreignTxnFee?.toString() || '',
                              notes: card.notes || '',
                            });
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={() => deleteCard(card.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => toggleField(card, 'isNotified')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          card.isNotified
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-amber-100 hover:text-amber-700'
                        }`}
                      >
                        {card.isNotified ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        Bank Notified
                      </button>
                      <button
                        onClick={() => toggleField(card, 'isActivated')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          card.isActivated
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-amber-100 hover:text-amber-700'
                        }`}
                      >
                        {card.isActivated ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        International Active
                      </button>
                      {card.foreignTxnFee && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          {card.foreignTxnFee}% Foreign Fee
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Money Tips */}
      <div className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
        <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Money Tips for {trip.country}
        </h3>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
          <li>• Local currency: <strong>{countryData.currency}</strong></li>
          <li>• Notify your bank before traveling to avoid card blocks</li>
          <li>• Enable international transactions on all cards</li>
          <li>• Keep some local cash for small purchases and emergencies</li>
          <li>• Consider a travel card with no foreign transaction fees</li>
        </ul>
      </div>
    </div>
  );
}
