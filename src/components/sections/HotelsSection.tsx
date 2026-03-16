'use client';

import { useState } from 'react';
import { Hotel, Plus, MapPin, Calendar, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface HotelsSectionProps {
  trip: any;
  onUpdate: () => void;
}

export default function HotelsSection({ trip, onUpdate }: HotelsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    checkIn: '',
    checkOut: '',
    roomType: '',
    bookingRef: '',
    confirmationNumber: '',
    contactPhone: '',
    amenities: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/trips/${trip.id}/hotels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Hotel added successfully!');
        setShowForm(false);
        setFormData({
          name: '',
          address: '',
          checkIn: '',
          checkOut: '',
          roomType: '',
          bookingRef: '',
          confirmationNumber: '',
          contactPhone: '',
          amenities: '',
        });
        onUpdate();
      } else {
        toast.error('Failed to add hotel');
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
          <Hotel className="w-6 h-6 text-primary-500" />
          Hotels
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Hotel
        </button>
      </div>

      {/* Hotel List */}
      {trip.hotels?.length > 0 ? (
        <div className="space-y-4">
          {trip.hotels.map((hotel: any) => (
            <div key={hotel.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {hotel.name}
                  </h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {hotel.address}
                  </p>
                </div>
                <span className={`badge ${
                  hotel.status === 'confirmed' ? 'badge-success' : 'badge-warning'
                }`}>
                  {hotel.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                  <p className="text-sm text-slate-500 mb-1">Check-in</p>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {formatDate(hotel.checkIn)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                  <p className="text-sm text-slate-500 mb-1">Check-out</p>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {formatDate(hotel.checkOut)}
                  </p>
                </div>
              </div>

              {(hotel.roomType || hotel.confirmationNumber || hotel.contactPhone) && (
                <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {hotel.roomType && (
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Room: <strong>{hotel.roomType}</strong>
                    </span>
                  )}
                  {hotel.confirmationNumber && (
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Confirmation: <strong>{hotel.confirmationNumber}</strong>
                    </span>
                  )}
                  {hotel.contactPhone && (
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Phone: <strong>{hotel.contactPhone}</strong>
                    </span>
                  )}
                </div>
              )}

              {hotel.amenities && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {hotel.amenities.split(',').map((amenity: string, idx: number) => (
                      <span key={idx} className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {amenity.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Hotel className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No hotels added yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Add your accommodation details
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Hotel
          </button>
        </div>
      )}

      {/* Add Hotel Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Add Hotel
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
                <label className="label">Hotel Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Address</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Check-in Date</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Check-out Date</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Room Type</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Deluxe King"
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Confirmation Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.confirmationNumber}
                    onChange={(e) => setFormData({ ...formData, confirmationNumber: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Contact Phone</label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Amenities (comma separated)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="WiFi, Pool, Gym, Breakfast"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
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
                  {isSubmitting ? 'Adding...' : 'Add Hotel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
