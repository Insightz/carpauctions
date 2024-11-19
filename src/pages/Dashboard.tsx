import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase, Auction, AuctionItem } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AuctionCard from '../components/AuctionCard';

type AuctionWithItems = Auction & {
  items: (AuctionItem & {
    _count: { bids: number };
    highest_bid: number | null;
  })[];
};

export default function Dashboard() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<AuctionWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserAuctions();
    }
  }, [user]);

  async function fetchUserAuctions() {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          items:auction_items (
            *,
            bids (count)
          )
        `)
        .eq('organizer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAuctions(data || []);
    } catch (error) {
      console.error('Error fetching user auctions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Auctions</h1>
        {user?.role === 'seller' && (
          <Link to="/auction/new" className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Auction</span>
          </Link>
        )}
      </div>

      {auctions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No auctions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              itemCount={auction.items?.length || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}