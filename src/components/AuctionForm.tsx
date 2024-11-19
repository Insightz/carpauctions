import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AuctionForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    contact_email: user?.email || '',
    contact_phone: user?.phone || '',
    location: '',
    terms_and_conditions: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.from('auctions').insert({
        ...formData,
        organizer_id: user.id,
        status: 'draft',
      }).select().single();

      if (error) throw error;

      toast.success('Auction created successfully!');
      navigate(`/auction/${data.id}`);
    } catch (error) {
      console.error('Error creating auction:', error);
      toast.error('Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Create New Auction Event</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="input w-full"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Spring Carp Auction 2024"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="input w-full"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your auction event..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-300">Start Date</label>
              <input
                type="datetime-local"
                id="start_date"
                name="start_date"
                required
                min={new Date().toISOString().slice(0, 16)}
                className="input w-full"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-300">End Date</label>
              <input
                type="datetime-local"
                id="end_date"
                name="end_date"
                required
                min={formData.start_date || new Date().toISOString().slice(0, 16)}
                className="input w-full"
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-300">Contact Email</label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                required
                className="input w-full"
                value={formData.contact_email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-300">Contact Phone</label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                required
                className="input w-full"
                value={formData.contact_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-300">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              required
              className="input w-full"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter the auction location"
            />
          </div>

          <div>
            <label htmlFor="terms_and_conditions" className="block text-sm font-medium text-gray-300">Terms and Conditions</label>
            <textarea
              id="terms_and_conditions"
              name="terms_and_conditions"
              rows={6}
              className="input w-full"
              value={formData.terms_and_conditions}
              onChange={handleChange}
              placeholder="Enter the terms and conditions for this auction..."
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Creating...' : 'Create Auction'}
          </button>
        </div>
      </div>
    </form>
  );
}