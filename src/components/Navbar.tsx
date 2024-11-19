import React from 'react';
import { Link } from 'react-router-dom';
import { Fish, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Fish className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold">Carp Auctions</span>
          </Link>

          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <NotificationBell />
                <ProfileDropdown />
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}