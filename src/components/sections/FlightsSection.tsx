'use client';

import { useState } from 'react';
import { Plane, Plus, Clock, MapPin, X } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface FlightsSectionProps {
  trip: any;
  onUpdate: () => void;
}

export default function FlightsSection({ trip, onUpdate }: FlightsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    airline: '',
    flightNumber: '',
    departureCity: '',
    arrivalCity: '',
    departureTime: '',
    arrivalTime: '',
    terminal: '',
    gate: '',
    seatNumber: '',
    bookingRef: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/trips/${trip.id}/flights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Flight added successfully!');
        setShowForm(false);
        setFormData({
          airline: '',
          flightNumber: '',
          departureCity: '',
          arrivalCity: '',
          departureTime: '',
          arrivalTime: '',
          terminal: '',
          gate: '',
          seatNumber: '',
          bookingRef: '',
        });
        onUpdate();
      } else {
        toast.error('Failed to add flight');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <Plane className="w-6 h-6 text-primary-500" />
          Flights
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Flight
        </button>
      </div>

      {/* Flight List */}
      {trip.flights?.length > 0 ? (
        <div className="space-y-4">
          {trip.flights.map((flight: any) => (
            <div key={flight.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {flight.airline}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Flight {flight.flightNumber}
                  </p>
                </div>
                <span className={`badge ${
                  flight.status === 'confirmed' ? 'badge-success' :
                  flight.status === 'delayed' ? 'badge-warning' :
                  'badge-danger'
                }`}>
                  {flight.status}
                </span>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {flight.departureCity}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDateTime(flight.departureTime)}
                  </p>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />
                  <Plane className="w-6 h-6 text-primary-500 mx-2" />
                  <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {flight.arrivalCity}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDateTime(flight.arrivalTime)}
                  </p>
                </div>
              </div>

              {(flight.terminal || flight.gate || flight.seatNumber || flight.bookingRef) && (
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {flight.terminal && (
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Terminal: <strong>{flight.terminal}</strong>
                    </span>
                  )}
                  {flight.gate && (
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Gate: <strong>{flight.gate}</strong>
                    </span>
                  )}
                  {flight.seatNumber && (
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Seat: <strong>{flight.seatNumber}</strong>
                    </span>
                  )}
                  {flight.bookingRef && (
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Booking Ref: <strong>{flight.bookingRef}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Plane className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No flights added yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Add your flight details or upload your e-ticket
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Flight
          </button>
        </div>
      )}

      {/* Add Flight Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Add Flight
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Airline</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.airline}
                    onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Flight Number</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Departure City</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.departureCity}
                    onChange={(e) => setFormData({ ...formData, departureCity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Arrival City</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.arrivalCity}
                    onChange={(e) => setFormData({ ...formData, arrivalCity: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Departure Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="input-field"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Arrival Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="input-field"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="label">Terminal</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.terminal}
                    onChange={(e) => setFormData({ ...formData, terminal: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Gate</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.gate}
                    onChange={(e) => setFormData({ ...formData, gate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Seat</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.seatNumber}
                    onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Booking Ref</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.bookingRef}
                    onChange={(e) => setFormData({ ...formData, bookingRef: e.target.value })}
                  />
                </div>
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
                  {isSubmitting ? 'Adding...' : 'Add Flight'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
