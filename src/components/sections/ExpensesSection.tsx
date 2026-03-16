'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  PieChart,
  Calendar,
  CreditCard,
  Banknote,
  Wallet,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, COUNTRY_DATA } from '@/lib/utils';

interface ExpensesSectionProps {
  trip: any;
  onUpdate: () => void;
}

const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', color: '#f59e0b', icon: '🍽️' },
  { id: 'transport', label: 'Transport', color: '#3b82f6', icon: '🚗' },
  { id: 'accommodation', label: 'Accommodation', color: '#8b5cf6', icon: '🏨' },
  { id: 'activities', label: 'Activities', color: '#10b981', icon: '🎯' },
  { id: 'shopping', label: 'Shopping', color: '#ec4899', icon: '🛍️' },
  { id: 'other', label: 'Other', color: '#6b7280', icon: '📦' },
];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'forex', label: 'Forex Card', icon: Wallet },
];

export default function ExpensesSection({ trip, onUpdate }: ExpensesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: 'food',
    description: '',
    amount: '',
    currency: COUNTRY_DATA[trip.country]?.currency || 'USD',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'card',
    notes: '',
  });

  const expenses = trip.expenses || [];
  const countryData = COUNTRY_DATA[trip.country] || { currency: 'USD' };

  // Calculate totals
  const totals = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byPayment: Record<string, number> = {};
    let total = 0;

    expenses.forEach((exp: any) => {
      total += exp.amount;
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
      byPayment[exp.paymentMethod || 'card'] = (byPayment[exp.paymentMethod || 'card'] || 0) + exp.amount;
    });

    return { total, byCategory, byPayment };
  }, [expenses]);

  const filteredExpenses = filterCategory
    ? expenses.filter((e: any) => e.category === filterCategory)
    : expenses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.amount) return;

    try {
      const res = await fetch(`/api/trips/${trip.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('Expense added');
      setFormData({
        category: 'food',
        description: '',
        amount: '',
        currency: countryData.currency,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'card',
        notes: '',
      });
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;

    try {
      const res = await fetch(`/api/trips/${trip.id}/expenses?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Deleted');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Expense Tracker
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track your spending in {trip.destination}
          </p>
        </div>
        <button onClick={() => setIsAdding(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Spent</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(totals.total, formData.currency)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm mt-3 opacity-80">
            {expenses.length} transactions
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-slate-500 mb-3">By Category</p>
          <div className="space-y-2">
            {CATEGORIES.slice(0, 3).map((cat) => {
              const amount = totals.byCategory[cat.id] || 0;
              const percentage = totals.total > 0 ? (amount / totals.total) * 100 : 0;
              return (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="text-sm">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 w-12 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm text-slate-500 mb-3">By Payment</p>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const amount = totals.byPayment[method.id] || 0;
              return (
                <div key={method.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{method.label}</span>
                  </div>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {formatCurrency(amount, formData.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Add Expense</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Amount *
                </label>
                <div className="flex">
                  <span className="px-3 bg-slate-100 dark:bg-slate-700 border border-r-0 border-slate-200 dark:border-slate-600 rounded-l-lg flex items-center text-slate-500">
                    {countryData.currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input w-full rounded-l-none"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  placeholder="What did you spend on?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="input w-full"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.id} value={method.id}>{method.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">Add Expense</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      {expenses.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterCategory === null
                ? 'bg-primary-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterCategory === cat.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="card p-12 text-center">
          <DollarSign className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No expenses recorded
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Start tracking your spending by adding an expense
          </p>
          <button onClick={() => setIsAdding(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-slate-200 dark:divide-slate-700">
          {filteredExpenses.map((expense: any) => {
            const category = CATEGORIES.find((c) => c.id === expense.category) || CATEGORIES[5];
            const payment = PAYMENT_METHODS.find((p) => p.id === expense.paymentMethod);
            const PaymentIcon = payment?.icon || CreditCard;

            return (
              <div key={expense.id} className="flex items-center gap-4 p-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-white truncate">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(expense.date)}
                    <PaymentIcon className="w-3 h-3 ml-2" />
                    {payment?.label}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {formatCurrency(expense.amount, expense.currency)}
                  </p>
                </div>
                <button
                  onClick={() => deleteExpense(expense.id)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
