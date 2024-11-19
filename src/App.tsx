import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import AuctionDetail from './pages/AuctionDetail';
import AuctionItemDetail from './pages/AuctionItemDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MyBids from './pages/MyBids';
import AuctionForm from './components/AuctionForm';
import AuctionItemForm from './components/AuctionItemForm';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auction/new" element={<AuctionForm />} />
              <Route path="/auction/:id" element={<AuctionDetail />} />
              <Route path="/auction/:auctionId/item/:itemId" element={<AuctionItemDetail />} />
              <Route path="/auction/:id/item/new" element={<AuctionItemForm />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-bids" element={<MyBids />} />
            </Routes>
          </main>
          <Toaster position="bottom-right" />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}