import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Auction } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuctionEditFormProps {
  auction: Auction;
  onSave: (updatedAuction: Auction) => void;
  onCancel: () => void;
}

export default function AuctionEditForm({ auction, onSave, onCancel }: AuctionEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: auction.title,
    description: auction.description || '',
    start_date: new Date(auction.start_date).toISOString().slice(0, 16),
    end_date: new Date(auction.end_date).toISOString().slice(0, 16),
    contact_email: auction.contact_email,
    contact_phone: auction.contact_phone,
    location: auction.location,
    terms_and_conditions: auction.terms_and_conditions || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('auctions')
        .update(formData)
        .eq('id', auction.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Auction updated successfully');
      onSave(data);
    } catch (error) {
      console.error('Error updating auction:', error);
      toast.error('Failed to update auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}