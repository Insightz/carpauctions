import React, { useState } from 'react';
import { Zap, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AutoBidManagerProps {
  itemId: string;
  currentMaxBid: number | null;
  isActive: boolean;
  onUpdate: () => void;
}

export default function AutoBidManager({ itemId, currentMaxBid, isActive, onUpdate }: AutoBidManagerProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDisableAutoBid = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('auto_bids')
        .update({ is_active: false })
        .eq('item_id', itemId);

      if (error) throw error;

      toast.success('Auto-bidding disabled');
      onUpdate();
    } catch (error) {
      console.error('Error disabling auto-bid:', error);
      toast.error('Failed to disable auto-bidding');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (!isActive || !currentMaxBid) return null;

  return (
    <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded-lg">
      <div className="flex items-center space-x-2">
        <Zap className="w-4 h-4 text-purple-400" />
        <span className="text-sm">
          Auto-bidding up to €{currentMaxBid}
        </span>
      </div>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-sm text-red-400 hover:text-red-300"
          disabled={loading}
        >
          Disable
        </button>
      ) : (
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <button
            onClick={handleDisableAutoBid}
            className="text-sm text-red-400 hover:text-red-300"
            disabled={loading}
          >
            Confirm Disable
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="text-sm text-gray-400 hover:text-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}