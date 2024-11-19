import React, { useState } from 'react';
import { Euro, Zap } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { supabase } from '../lib/supabase';
import type { Bid } from '../lib/supabase';
import toast from 'react-hot-toast';

interface BidComponentProps {
  itemId: string;
  startPrice: number;
  minimumBidIncrement: number;
  auctionFeePercentage: number;
  vatPercentage: number;
  onBidPlaced: () => void;
  onClose: () => void;
}

const BidComponent: React.FC<BidComponentProps> = ({
  itemId,
  startPrice,
  minimumBidIncrement,
  auctionFeePercentage,
  vatPercentage,
  onBidPlaced,
  onClose,
}) => {
  const [bidAmount, setBidAmount] = useState(startPrice + minimumBidIncrement);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoBid, setIsAutoBid] = useState(false);
  const [maxAutoBidAmount, setMaxAutoBidAmount] = useState(startPrice + minimumBidIncrement * 5);

  const calculateTotalBreakdown = (amount: number) => {
    const vatOnBid = amount * (vatPercentage / 100);
    const auctionFee = amount * (auctionFeePercentage / 100);
    const vatOnFees = auctionFee * (vatPercentage / 100);
    const total = amount + vatOnBid + auctionFee + vatOnFees;

    return {
      baseBid: amount,
      vatOnBid,
      auctionFee,
      vatOnFees,
      total,
    };
  };

  const handleBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || startPrice;
    setBidAmount(Math.max(value, startPrice + minimumBidIncrement));
  };

  const handleMaxAutoBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || startPrice;
    setMaxAutoBidAmount(Math.max(value, bidAmount));
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const handlePlaceBid = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('You must be logged in to place a bid');
      }

      // Create the bid
      const { error: bidError } = await supabase
        .from('bids')
        .insert({
          item_id: itemId,
          bidder_id: user.id,
          amount: bidAmount,
        } as Partial<Bid>);

      if (bidError) {
        throw bidError;
      }

      // If auto-bid is enabled, create the auto-bid entry
      if (isAutoBid) {
        const { error: autoBidError } = await supabase
          .from('auto_bids')
          .insert({
            item_id: itemId,
            bidder_id: user.id,
            max_amount: maxAutoBidAmount,
            is_active: true,
          });

        if (autoBidError) {
          throw autoBidError;
        }

        // Create initial auto-bid notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'auto_bid_placed',
            title: 'Auto-bidding Enabled',
            message: `Auto-bidding has been set up with a maximum bid of €${maxAutoBidAmount}`,
            item_id: itemId,
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }

      // Close modals and refresh
      setShowConfirmation(false);
      onBidPlaced();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while placing your bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breakdown = calculateTotalBreakdown(bidAmount);

  return (
    <>
      <div className="space-y-6 p-6 bg-gray-800 rounded-lg">
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Bid Input Section */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-300">Your Bid</label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={bidAmount}
              onChange={handleBidChange}
              step={minimumBidIncrement}
              min={startPrice + minimumBidIncrement}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>
          <p className="text-xs text-gray-400">
            Minimum bid: €{formatPrice(startPrice + minimumBidIncrement)}
          </p>
        </div>

        {/* Auto-Bid Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-bid"
              checked={isAutoBid}
              onChange={(e) => setIsAutoBid(e.target.checked)}
              className="rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-700"
            />
            <label htmlFor="auto-bid" className="flex items-center space-x-2 text-sm text-gray-300">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Enable Auto-Bidding</span>
            </label>
          </div>
          
          {isAutoBid && (
            <div className="mt-2">
              <label className="block text-sm text-gray-300">Maximum Auto-Bid Amount</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={maxAutoBidAmount}
                  onChange={handleMaxAutoBidChange}
                  step={minimumBidIncrement}
                  min={bidAmount}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                We'll automatically bid up to this amount to help you win
              </p>
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 border-t border-gray-700 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Starting bid:</span>
            <span>€{formatPrice(breakdown.baseBid)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">VAT on bid ({vatPercentage}%):</span>
            <span>€{formatPrice(breakdown.vatOnBid)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Auction fees ({auctionFeePercentage}%):</span>
            <span>€{formatPrice(breakdown.auctionFee)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">VAT on fees ({vatPercentage}%):</span>
            <span>€{formatPrice(breakdown.vatOnFees)}</span>
          </div>

          <div className="flex justify-between font-semibold pt-2 border-t border-gray-700">
            <span>Total:</span>
            <span>€{formatPrice(breakdown.total)}</span>
          </div>
        </div>

        {/* Place Bid Button */}
        <button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setShowConfirmation(true)}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
        </button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Bid</AlertDialogTitle>
            <AlertDialogDescription>
              {isAutoBid ? (
                <>
                  Are you sure you want to place an initial bid of €{formatPrice(bidAmount)} with
                  automatic bidding up to €{formatPrice(maxAutoBidAmount)}? The total amount
                  including fees and VAT will be up to €{formatPrice(calculateTotalBreakdown(maxAutoBidAmount).total)}.
                </>
              ) : (
                <>
                  Are you sure you want to place a bid of €{formatPrice(bidAmount)}? The total amount
                  including fees and VAT will be €{formatPrice(breakdown.total)}.
                </>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePlaceBid}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Yes, Place Bid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BidComponent;