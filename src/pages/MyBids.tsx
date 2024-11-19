import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Filter, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AutoBidManager from '../components/AutoBidManager';
import toast from 'react-hot-toast';

type Bid = {
  id: string;
  created_at: string;
  amount: number;
  item_id: string;
};

type AuctionItem = {
  id: string;
  title: string;
  images: string[];
  start_price: number;
  auction_id: string;
};

type Auction = {
  id: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
};

type GroupedBids = {
  [key: string]: {
    auction: Auction;
    items: {
      [key: string]: {
        item: AuctionItem;
        bids: Bid[];
      };
    };
  };
};

type AutoBid = {
  item_id: string;
  max_amount: number;
  is_active: boolean;
};

export default function MyBids() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groupedBids, setGroupedBids] = useState<GroupedBids>({});
  const [expandedAuctions, setExpandedAuctions] = useState<Set<string>>(new Set());
  const [autoBids, setAutoBids] = useState<Record<string, AutoBid>>({});
  const [selectedAuction, setSelectedAuction] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<string>('all');
  const [stats, setStats] = useState({
    totalBids: 0,
    activeBids: 0,
    wonBids: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (!user) return;
    fetchBids();
    fetchAutoBids();
  }, [user]);

  const fetchAutoBids = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('auto_bids')
        .select('*')
        .eq('bidder_id', user.id);

      if (error) throw error;

      const autoBidsMap = data.reduce((acc, bid) => {
        acc[bid.item_id] = bid;
        return acc;
      }, {} as Record<string, AutoBid>);

      setAutoBids(autoBidsMap);
    } catch (error) {
      console.error('Error fetching auto-bids:', error);
    }
  };

  const fetchBids = async () => {
    if (!user) return;

    try {
      const { data: bids, error: bidsError } = await supabase
        .from('bids')
        .select(`
          *,
          auction_items!inner (
            *,
            auctions!inner (*)
          )
        `)
        .eq('bidder_id', user.id)
        .order('created_at', { ascending: false });

      if (bidsError) throw bidsError;

      // Group bids by auction and item
      const grouped = (bids || []).reduce((acc: GroupedBids, bid) => {
        const item = bid.auction_items;
        const auction = item.auctions;
        const auctionId = auction.id;
        const itemId = item.id;

        if (!acc[auctionId]) {
          acc[auctionId] = {
            auction,
            items: {},
          };
        }

        if (!acc[auctionId].items[itemId]) {
          acc[auctionId].items[itemId] = {
            item,
            bids: [],
          };
        }

        acc[auctionId].items[itemId].bids.push(bid);
        return acc;
      }, {});

      setGroupedBids(grouped);

      // Calculate statistics
      const stats = {
        totalBids: bids?.length || 0,
        activeBids: 0,
        wonBids: 0,
        totalSpent: 0,
      };

      Object.values(grouped).forEach(({ auction, items }) => {
        Object.values(items).forEach(({ item, bids }) => {
          const highestBid = Math.max(...bids.map(b => b.amount));
          if (auction.status === 'active') {
            stats.activeBids++;
          } else if (auction.status === 'ended' && item.highest_bid === highestBid) {
            stats.wonBids++;
            stats.totalSpent += highestBid;
          }
        });
      });

      setStats(stats);
    } catch (error) {
      console.error('Error fetching bids:', error);
      toast.error('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuction = (auctionId: string) => {
    const newExpanded = new Set(expandedAuctions);
    if (newExpanded.has(auctionId)) {
      newExpanded.delete(auctionId);
    } else {
      newExpanded.add(auctionId);
    }
    setExpandedAuctions(newExpanded);
  };

  const filteredAuctions = Object.entries(groupedBids).filter(([auctionId]) => {
    if (selectedAuction === 'all') return true;
    return auctionId === selectedAuction;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <h3 className="text-lg font-semibold mb-1">Total Bids</h3>
          <p className="text-2xl font-bold text-purple-400">{stats.totalBids}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-1">Active Bids</h3>
          <p className="text-2xl font-bold text-green-400">{stats.activeBids}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-1">Won Auctions</h3>
          <p className="text-2xl font-bold text-yellow-400">{stats.wonBids}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-1">Total Spent</h3>
          <p className="text-2xl font-bold text-red-400">€{stats.totalSpent}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Filter by Auction
            </label>
            <select
              value={selectedAuction}
              onChange={(e) => setSelectedAuction(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Auctions</option>
              {Object.entries(groupedBids).map(([id, { auction }]) => (
                <option key={id} value={id}>
                  {auction.title}
                </option>
              ))}
            </select>
          </div>
          {selectedAuction !== 'all' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Filter by Item
              </label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="input w-full"
              >
                <option value="all">All Items</option>
                {Object.entries(groupedBids[selectedAuction]?.items || {}).map(([id, { item }]) => (
                  <option key={id} value={id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Bids List */}
      {filteredAuctions.map(([auctionId, { auction, items }]) => (
        <div key={auctionId} className="card">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleAuction(auctionId)}
          >
            <div>
              <h3 className="text-xl font-semibold">{auction.title}</h3>
              <p className="text-sm text-gray-400">
                {format(new Date(auction.start_date), 'PPP')} - {format(new Date(auction.end_date), 'PPP')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                auction.status === 'active' 
                  ? 'bg-green-500/10 text-green-400'
                  : auction.status === 'ended'
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-purple-500/10 text-purple-400'
              }`}>
                {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
              </span>
              {expandedAuctions.has(auctionId) ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          {expandedAuctions.has(auctionId) && (
            <div className="mt-4 space-y-4">
              {Object.entries(items)
                .filter(([itemId]) => selectedItem === 'all' || itemId === selectedItem)
                .map(([itemId, { item, bids }]) => (
                  <div key={itemId} className="border-l-2 border-gray-700 pl-4">
                    <Link
                      to={`/auction/${auctionId}/item/${itemId}`}
                      className="flex items-center space-x-4 hover:text-purple-400"
                    >
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-gray-400">
                          {bids.length} bid{bids.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </Link>

                    {autoBids[itemId] && (
                      <div className="mt-2">
                        <AutoBidManager
                          itemId={itemId}
                          currentMaxBid={autoBids[itemId].max_amount}
                          isActive={autoBids[itemId].is_active}
                          onUpdate={fetchAutoBids}
                        />
                      </div>
                    )}

                    <div className="mt-2 space-y-2">
                      {bids.map((bid) => (
                        <div
                          key={bid.id}
                          className="flex justify-between items-center text-sm text-gray-400"
                        >
                          <span>{format(new Date(bid.created_at), 'PPp')}</span>
                          <span className="font-semibold">€{bid.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}

      {filteredAuctions.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No bids found
        </div>
      )}
    </div>
  );
}