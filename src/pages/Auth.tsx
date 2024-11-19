import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Fish } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const returnUrl = sessionStorage.getItem('returnUrl');
        sessionStorage.removeItem('returnUrl');
        navigate(returnUrl || '/', { replace: true });
        toast.success('Signed in successfully');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="flex items-center space-x-2 mb-8">
        <Fish className="w-12 h-12 text-purple-500" />
        <h1 className="text-3xl font-bold">CarpBid</h1>
      </div>
      
      <div className="w-full max-w-md">
        <div className="card">
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#7c3aed',
                    brandAccent: '#6d28d9',
                    inputBackground: '#374151',
                    inputText: 'white',
                    inputPlaceholder: '#9CA3AF',
                    backgroundSecondary: '#1F2937',
                    backgroundPrimary: '#111827',
                  },
                },
              },
              className: {
                container: 'supabase-container',
                button: 'btn btn-primary w-full',
                input: 'input w-full',
                label: 'text-gray-300 mb-1 block',
              },
            }}
            providers={['google']}
            redirectTo={`${window.location.origin}/auth/callback`}
            onlyThirdPartyProviders={false}
          />
        </div>
      </div>
    </div>
  );
}