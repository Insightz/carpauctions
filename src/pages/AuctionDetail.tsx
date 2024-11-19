import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { MapPin, Calendar, Phone, Mail, Plus, Edit, ArrowLeft } from 'lucide-react';
import { supabase, Auction, AuctionItem, AuctionStatus } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AuctionItemCard from '../components/AuctionItemCard';
import AuctionStatusManager from '../components/AuctionStatusManager';
import AuctionEditForm from '../components/AuctionEditForm';
import toast from 'react-hot-toast';

type AuctionWithItems = Auction & {
  items: (AuctionItem & { highest_bid: number | null })[];
  organizer: { full_name: string; email: string };
};

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState<AuctionWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchAuctionDetails();
    const subscription = supabase
      .channel('auction_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'auction_items',
        filter: `auction_id=eq.${id}`,
      }, 
      () => {
        fetchAuctionDetails();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  async function fetchAuctionDetails() {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          items:auction_items(*),
          organizer:profiles(full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setAuction(data);
    } catch (error) {
      console.error('Error fetching auction details:', error);
      toast.error('Failed to load auction details');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = (newStatus: AuctionStatus) => {
    if (auction) {
      setAuction({ ...auction, status: newStatus });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Auction not found</p>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-primary mt-4"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isOrganizer = user?.id === auction.organizer_id;
  const canManageAuction = isOrganizer || user?.role === 'admin';
  const canEdit = canManageAuction && ['draft', 'upcoming'].includes(auction.status);
  const canAddItems = isOrganizer && auction.status !== 'ended';
  const timeToStart = new Date(auction.start_date) > new Date() 
    ? formatDistanceToNow(new Date(auction.start_date), { addSuffix: true })
    : null;
  const timeToEnd = formatDistanceToNow(new Date(auction.end_date), { addSuffix: true });

  if (isEditing) {
    return (
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Edit Auction</h2>
        <div className="card">
          <AuctionEditForm
            auction={auction}
            onSave={(updatedAuction) => {
              setAuction({ ...auction, ...updatedAuction });
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="card">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{auction.title}</h1>
            <p className="text-gray-400 mb-4">{auction.description}</p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {canManageAuction && (
              <AuctionStatusManager
                auctionId={auction.id}
                currentStatus={auction.status}
                onStatusChange={handleStatusChange}
              />
            )}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Edit className="w-5 h-5" />
                <span>Edit Auction</span>
              </button>
            )}
            {canAddItems && (
              <Link to={`/auction/${auction.id}/item/new`} className="btn btn-primary flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Add Item</span>
              </Link>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-300">
              <Calendar className="w-5 h-5 text-purple-400" />
              <div>
                <p>Starts: {format(new Date(auction.start_date), 'PPP p')}</p>
                <p>Ends: {format(new Date(auction.end_date), 'PPP p')}</p>
                {timeToStart ? (
                  <p className="text-purple-400">Starts {timeToStart}</p>
                ) : (
                  <p className="text-purple-400">Ends {timeToEnd}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 text-gray-300">
              <MapPin className="w-5 h-5 text-purple-400" />
              <span>{auction.location}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-300">
              <Mail className="w-5 h-5 text-purple-400" />
              <span>{auction.contact_email}</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-300">
              <Phone className="w-5 h-5 text-purple-400" />
              <span>{auction.contact_phone}</span>
            </div>
          </div>
        </div>

        {auction.terms_and_conditions && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Terms and Conditions</h3>
            <p className="text-gray-300 whitespace-pre-line">{auction.terms_and_conditions}</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Auction Items ({auction.items?.length || 0})</h2>
        
        {auction.items?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auction.items.map((item) => (
              <AuctionItemCard
                key={item.id}
                item={item}
                auctionStatus={auction.status}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <p className="text-gray-400">No items have been added to this auction yet</p>
            {canAddItems && (
              <Link to={`/auction/${auction.id}/item/new`} className="btn btn-primary mt-4">
                Add First Item
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}