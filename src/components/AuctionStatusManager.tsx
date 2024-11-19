import React, { useState } from 'react';
import { PlayCircle, PauseCircle } from 'lucide-react';
import { supabase, AuctionStatus } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuctionStatusManagerProps {
  auctionId: string;
  currentStatus: AuctionStatus;
  onStatusChange: (newStatus: AuctionStatus) => void;
}

export default function AuctionStatusManager({ 
  auctionId, 
  currentStatus, 
  onStatusChange 
}: AuctionStatusManagerProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: AuctionStatus) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('auctions')
        .update({ status: newStatus })
        .eq('id', auctionId);

      if (error) throw error;

      onStatusChange(newStatus);
      toast.success(`Auction ${newStatus}`);
    } catch (error) {
      console.error('Error updating auction status:', error);
      toast.error('Failed to update auction status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusActions = () => {
    switch (currentStatus) {
      case 'draft':
        return (
          <button
            onClick={() => handleStatusChange('upcoming')}
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2"
          >
            <PlayCircle className="w-5 h-5" />
            <span>{loading ? 'Publishing...' : 'Publish Auction'}</span>
          </button>
        );
      case 'upcoming':
        return (
          <button
            onClick={() => handleStatusChange('active')}
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2"
          >
            <PlayCircle className="w-5 h-5" />
            <span>{loading ? 'Starting...' : 'Start Auction'}</span>
          </button>
        );
      case 'active':
        return (
          <button
            onClick={() => handleStatusChange('ended')}
            disabled={loading}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <PauseCircle className="w-5 h-5" />
            <span>{loading ? 'Ending...' : 'End Auction'}</span>
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">Status:</span>
        <span className={`px-2 py-1 rounded text-sm font-medium ${
          currentStatus === 'active' 
            ? 'bg-green-500/10 text-green-400'
            : currentStatus === 'ended'
            ? 'bg-red-500/10 text-red-400'
            : 'bg-purple-500/10 text-purple-400'
        }`}>
          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </span>
      </div>
      {getStatusActions()}
    </div>
  );
}