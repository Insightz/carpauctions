import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AuctionCard from '../components/AuctionCard';
import type { Auction, AuctionItem } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type AuctionWithItems = Auction & {
  items: AuctionItem[];
};

export default function Home() {
  const [auctions, setAuctions] = useState<AuctionWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    let mounted = true;

    async function fetchAuctions() {
      if (authLoading) return;

      try {
        const { data, error } = await supabase
          .from('auctions')
          .select(`
            *,
            items:auction_items(images)
          `)
          .in('status', ['upcoming', 'active'])
          .order('start_date', { ascending: true });

        if (error) throw error;

        if (mounted) {
          setAuctions(data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching auctions:', err);
        if (mounted) {
          setError('Failed to load auctions. Please try again.');
          toast.error('Failed to load auctions');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    // Initial fetch
    fetchAuctions();

    // Set up realtime subscription
    const channel = supabase
      .channel('auction_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'auctions',
      }, () => {
        fetchAuctions();
      })
      .subscribe();

    // Cleanup
    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchAuctions();
          }}
          className="mt-4 btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  const upcomingAuctions = auctions.filter(a => a.status === 'upcoming');
  const activeAuctions = auctions.filter(a => a.status === 'active');

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Premium Carp Auctions</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Discover exceptional carp offered directly from trusted and renowned European carp stockists. Place your bids and expand your stock with some of the nicest fish around.
        </p>
      </div>

      {activeAuctions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Active Auctions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAuctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                itemCount={auction.items?.length || 0}
              />
            ))}
          </div>
        </section>
      )}

      {upcomingAuctions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Upcoming Auctions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingAuctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                itemCount={auction.items?.length || 0}
              />
            ))}
          </div>
        </section>
      )}

      {auctions.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">No active or upcoming auctions at the moment</p>
        </div>
      )}
    </div>
  );
}