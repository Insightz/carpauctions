import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, MapPin, Image } from 'lucide-react';
import { Auction } from '../lib/supabase';

type AuctionCardProps = {
  auction: Auction & {
    items?: {
      images: string[];
    }[];
  };
  itemCount: number;
};

export default function AuctionCard({ auction, itemCount }: AuctionCardProps) {
  const timeText = auction.status === 'upcoming'
    ? `Starts ${formatDistanceToNow(new Date(auction.start_date), { addSuffix: true })}`
    : `Ends ${formatDistanceToNow(new Date(auction.end_date), { addSuffix: true })}`;
  
  const firstItemImage = auction.items?.[0]?.images?.[0];
  
  return (
    <Link to={`/auction/${auction.id}`}>
      <div className="card hover:border-purple-500 transition-colors">
        <div className="space-y-4">
          {firstItemImage ? (
            <div className="aspect-w-16 aspect-h-9 -mx-6 -mt-6 mb-4">
              <img
                src={firstItemImage}
                alt={auction.title}
                className="object-cover w-full h-48 rounded-t-lg"
              />
            </div>
          ) : (
            <div className="aspect-w-16 aspect-h-9 -mx-6 -mt-6 mb-4 bg-gray-800 flex items-center justify-center rounded-t-lg">
              <Image className="w-12 h-12 text-gray-600" />
            </div>
          )}

          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{auction.title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                auction.status === 'active' 
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-purple-500/10 text-purple-400'
              }`}>
                {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
              </span>
            </div>
            <p className="text-gray-400 line-clamp-2">{auction.description}</p>
          </div>

          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>{timeText}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>{auction.location}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              {itemCount} item{itemCount !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}