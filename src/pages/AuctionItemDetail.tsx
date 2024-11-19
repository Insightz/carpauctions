import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { Ruler, Weight, Fish, Clock, ArrowLeft, Trash, Crown } from 'lucide-react';
import { supabase, AuctionItem, Auction, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BidComponent from '../components/Bid';
import toast from 'react-hot-toast';

type ExtendedBid = {
  id: string;
  created_at: string;
  amount: number;
  bidder: Profile;
};

type ExtendedAuctionItem = AuctionItem & {
  auction: Auction;
  seller: Profile;
  bids?: ExtendedBid[];
};

export default function AuctionItemDetail() {
  const { auctionId, itemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<ExtendedAuctionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [isHighestBidder, setIsHighestBidder] = useState(false);

  const fetchItemDetails = async () => {
    try {
      const { data: itemData, error: itemError } = await supabase
        .from('auction_items')
        .select(`
          *,
          auction:auctions(*),
          seller:profiles!auction_items_seller_id_fkey(*)
        `)
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      // Check if current user is highest bidder
      if (user && itemData.highest_bid) {
        const { data: highestBid, error: bidError } = await supabase
          .from('bids')
          .select('bidder_id')
          .eq('item_id', itemId)
          .eq('amount', itemData.highest_bid)
          .single();

        if (!bidError && highestBid) {
          setIsHighestBidder(highestBid.bidder_id === user.id);
        }
      }

      // Fetch bids if user is admin or seller
      let bidsData = [];
      if (user?.role === 'admin' || user?.id === itemData.seller_id) {
        const { data: bids, error: bidsError } = await supabase
          .from('bids')
          .select(`
            *,
            bidder:profiles(*)
          `)
          .eq('item_id', itemId)
          .order('created_at', { ascending: false });

        if (bidsError) throw bidsError;
        bidsData = bids;
      }

      setItem({ ...itemData, bids: bidsData });
    } catch (error) {
      console.error('Error fetching item details:', error);
      toast.error('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await fetchItemDetails();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Set up realtime subscriptions
    const channel = supabase
      .channel('detailed_item_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'auction_items',
        filter: `id=eq.${itemId}`,
      }, () => {
        fetchItemDetails();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bids',
        filter: `item_id=eq.${itemId}`,
      }, () => {
        fetchItemDetails();
      })
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [itemId, user]);

  const handleDelete = async () => {
    if (!item || !window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      // Check if item has bids
      const { count, error: countError } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', item.id);

      if (countError) throw countError;

      if (count && count > 0) {
        toast.error('Cannot delete item with existing bids');
        return;
      }

      const { error: deleteError } = await supabase
        .from('auction_items')
        .delete()
        .eq('id', item.id);

      if (deleteError) throw deleteError;

      toast.success('Item deleted successfully');
      navigate(`/auction/${item.auction_id}`);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Item not found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 btn btn-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  const canDelete = (user?.role === 'admin' || user?.id === item.seller_id) && 
                   ['draft', 'upcoming'].includes(item.auction.status);
  const canPlaceBid = item.auction.status === 'active' && (!user || user.id !== item.seller_id);
  const showBidHistory = user?.role === 'admin' || user?.id === item.seller_id;

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
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Auction</span>
        </button>

        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn btn-secondary flex items-center space-x-2 text-red-400 hover:text-red-300"
          >
            <Trash className="w-5 h-5" />
            <span>{deleting ? 'Deleting...' : 'Delete Item'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-w-16 aspect-h-9">
            <img
              src={item.images[currentImageIndex]}
              alt={item.title}
              className="object-cover w-full h-96 rounded-lg"
            />
          </div>
          {item.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {item.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative rounded-lg overflow-hidden ${
                    index === currentImageIndex ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${item.title} - Image ${index + 1}`}
                    className="object-cover w-full h-20"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
            <p className="text-gray-400">{item.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Weight className="w-5 h-5 text-purple-400" />
              <span>{item.weight} kg</span>
            </div>
            <div className="flex items-center space-x-2">
              <Ruler className="w-5 h-5 text-purple-400" />
              <span>{item.length} cm</span>
            </div>
            <div className="flex items-center space-x-2">
              <Fish className="w-5 h-5 text-purple-400" />
              <span className="capitalize">{item.species}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span>Age: {item.age}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-gray-400">Gender: <span className="capitalize">{item.gender}</span></p>
            {item.bloodline && (
              <p className="text-gray-400">Bloodline: {item.bloodline}</p>
            )}
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-400">Current Price</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">€{item.highest_bid || item.start_price}</p>
                  {isHighestBidder && (
                    <Crown className="w-5 h-5 text-yellow-400" title="You have the highest bid" />
                  )}
                </div>
                <p className={`text-xs ${reserveStatus.className}`}>
                  {reserveStatus.text}
                </p>
              </div>
              {canPlaceBid && (
                <button
                  onClick={() => {
                    if (!user) {
                      sessionStorage.setItem('returnUrl', location.pathname);
                      navigate('/login');
                      toast.error('Please sign in to place a bid');
                    } else {
                      setShowBidForm(true);
                    }
                  }}
                  className="btn btn-primary"
                >
                  Place Bid
                </button>
              )}
            </div>
            <div className="text-sm text-gray-400">
              <p>Starting price: €{item.start_price}</p>
              {item.auction.end_date && (
                <p>
                  Ends {formatDistanceToNow(new Date(item.auction.end_date), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bid History */}
      {showBidHistory && item.bids && item.bids.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Bid History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Bidder</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {item.bids.map((bid) => (
                  <tr key={bid.id} className="border-b border-gray-700/50">
                    <td className="py-2">
                      {format(new Date(bid.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="py-2">{bid.bidder.full_name}</td>
                    <td className="py-2 text-right">€{bid.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bid Modal */}
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
              startPrice={item.highest_bid || item.start_price}
              minimumBidIncrement={5.0}
              auctionFeePercentage={10}
              vatPercentage={21}
              onBidPlaced={() => {
                setShowBidForm(false);
                toast.success('Bid placed successfully!');
              }}
              onClose={() => setShowBidForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}