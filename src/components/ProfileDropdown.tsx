import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Package, ChevronDown, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-300 hover:text-white"
      >
        <span>{user.full_name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-50">
          <Link
            to="/profile"
            className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700"
            onClick={() => setIsOpen(false)}
          >
            <User className="w-4 h-4 mr-2" />
            My Profile
          </Link>
          
          <Link
            to="/my-bids"
            className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700"
            onClick={() => setIsOpen(false)}
          >
            <Target className="w-4 h-4 mr-2" />
            My Bids
          </Link>
          
          {(user.role === 'seller' || user.role === 'admin') && (
            <Link
              to="/dashboard"
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <Package className="w-4 h-4 mr-2" />
              My Auctions
            </Link>
          )}
        </div>
      )}
    </div>
  );
}