import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Ruler, Weight, Fish, Crown } from 'lucide-react';
import { supabase, AuctionItem, AuctionStatus } from '../lib/supabase';
import BidComponent from './Bid';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type AuctionItemCardProps = {
  item: AuctionItem & { highest_bid: number | null };
  auctionStatus: AuctionStatus;
};

export default function AuctionItemCard({ item, auctionStatus }: AuctionItemCardProps) {
  const [showBidForm, setShowBidForm] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(item.highest_bid || item.start_price);
  const [bidCount, setBidCount] = useState(0);
  const [isHighestBidder, setIsHighestBidder] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    fetchBidCount();
    checkIfHighestBidder();
  }, [item.id]);

  const fetchBidCount = async () => {
    const { data: bids, error } = await supabase
      .from('bids')
      .select('id')
      .eq('item_id', item.id);
      
    if (error) {
      console.error('Error fetching bid count:', error);
      return;
    }
    setBidCount(bids.length);
  };

  const checkIfHighestBidder = async () => {
    if (!user || !item.highest_bid) return;

    const { data, error } = await supabase
      .from('bids')
      .select('bidder_id')
      .eq('item_id', item.id)
      .eq('amount', item.highest_bid)
      .single();

    if (error) {
      console.error('Error checking highest bidder:', error);
      return;
    }

    setIsHighestBidder(data.bidder_id === user.id);
  };

  const handleBidClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      sessionStorage.setItem('returnUrl', location.pathname);
      navigate('/login');
      toast.error('Please sign in to place a bid');
    } else {
      setShowBidForm(true);
    }
  };

  const handleBidSuccess = async () => {
    const { data: updatedItem, error } = await supabase
      .from('auction_items')
      .select('highest_bid')
      .eq('id', item.id)
      .single();

    if (error) {
      console.error('Error refreshing auction item details:', error);
      return;
    }

    setCurrentPrice(updatedItem.highest_bid || item.start_price);
    await fetchBidCount();
    await checkIfHighestBidder();
    setShowBidForm(false);
    toast.success('Bid placed successfully!');
  };

  const getReserveStatus = () => {
    const currentPrice = item.highest_bid || item.start_price;
    
    if (!item.min_sell_price || item.min_sell_price === item.start_price) {
      return { text: 'No reserve', className: 'text-green-400' };
    }
    if (currentPrice >= item.min_sell_price) {
      return { text: 'Reserve met', className: 'text-green-400' };
    }
    return { text: 'Reserve not met', className: 'text-yellow-400' };
  };

  const reserveStatus = getReserveStatus();

  return (
    <div className="card hover:border-purple-500 transition-colors">
      <Link to={`/auction/${item.auction_id}/item/${item.id}`} className="block">
        <div className="aspect-w-16 aspect-h-9 mb-4">
          <img
            src={item.images[0]}
            alt={item.title}
            className="object-cover w-full h-48 rounded-lg"
          />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
            <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex items-center space-x-1">
              <Weight className="w-4 h-4 text-purple-400" />
              <span>{item.weight}kg</span>
            </div>
            <div className="flex items-center space-x-1">
              <Ruler className="w-4 h-4 text-purple-400" />
              <span>{item.length}cm</span>
            </div>
            <div className="flex items-center space-x-1">
              <Fish className="w-4 h-4 text-purple-400" />
              <span>{item.species}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-400">Current price</p>
                <div className="flex items-center space-x-2">
                  <p className="text-lg font-semibold">
                    €{currentPrice} ({bidCount} bids)
                  </p>
                  {isHighestBidder && (
                    <Crown className="w-4 h-4 text-yellow-400" title="You have the highest bid" />
                  )}
                </div>
                <p className={`text-xs ${reserveStatus.className}`}>
                  {reserveStatus.text}
                </p>
              </div>
              {auctionStatus === 'active' && (
                <button
                  className="btn btn-primary text-sm"
                  onClick={handleBidClick}
                >
                  Place Bid
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>

      {showBidForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowBidForm(false)}
        >
          <div
            className="max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <BidComponent
              itemId={item.id}
              startPrice={currentPrice}
              minimumBidIncrement={5.0}
              auctionFeePercentage={10}
              vatPercentage={21}
              onBidPlaced={handleBidSuccess}
              onClose={() => setShowBidForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}