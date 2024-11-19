import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type CarpSpecies = 'common' | 'mirror' | 'koi' | 'leather';
export type CarpAge = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8' | 'C9' | 'C10';
export type AuctionStatus = 'draft' | 'upcoming' | 'active' | 'ended';

export type Profile = {
  id: string;
  created_at: string;
  email: string;
  role: 'admin' | 'seller' | 'buyer';
  full_name: string;
  phone?: string;
};

export type Auction = {
  id: string;
  created_at: string;
  organizer_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: AuctionStatus;
  contact_email: string;
  contact_phone: string;
  location: string;
  terms_and_conditions?: string;
};

export type AuctionItem = {
  id: string;
  created_at: string;
  auction_id: string;
  seller_id: string;
  title: string;
  description: string;
  start_price: number;
  min_sell_price: number;
  images: string[];
  weight: number;
  length: number;
  bloodline: string;
  species: CarpSpecies;
  age: CarpAge;
  gender: 'male' | 'female';
  last_bid_at: string | null;
  highest_bid: number | null;
};

export type Bid = {
  id: string;
  created_at: string;
  item_id: string;
  bidder_id: string;
  amount: number;
};

export const UPLOAD_CONFIG = {
  maxFiles: 10,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
};