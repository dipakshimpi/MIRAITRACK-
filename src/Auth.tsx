import React, { useState, useEffect } from 'react';
import keycloak from './lib/keycloak';
import { supabase } from './lib/supabase';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { LogIn, ShieldCheck } from 'lucide-react';
import { UserProfile } from './types';

interface AuthProps {
  onUserChange: (user: UserProfile | null) => void;
}

export default function Auth({ onUserChange }: AuthProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        });

        if (authenticated && keycloak.tokenParsed) {
          const { sub, name, email } = keycloak.tokenParsed as any;
          
          // Check if user exists in Supabase
          const { data: userDoc, error } = await supabase
            .from('users')
            .select('*')
            .eq('uid', sub)
            .single();

          if (error && error.code === 'PGRST116') {
            // User doesn't exist, create profile
            const newProfile: UserProfile = {
              uid: sub,
              name: name || email || 'Anonymous',
              email: email || '',
              createdAt: new Date().toISOString(),
              totalPresent: 0,
              totalAbsent: 0,
              productivityScore: 0
            };
            
            const { error: insertError } = await supabase
              .from('users')
              .insert([newProfile]);
            
            if (!insertError) {
              onUserChange(newProfile);
            }
          } else if (userDoc) {
            onUserChange(userDoc as UserProfile);
          }
        } else {
          onUserChange(null);
        }
      } catch (error) {
        console.error("Keycloak initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initKeycloak();
  }, [onUserChange]);

  const handleLogin = () => {
    keycloak.login({ idpHint: 'google' });
  };

  if (loading) return <div className="flex items-center justify-center h-screen font-bold text-indigo-600 animate-pulse">Initializing Mirai Track Auth...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none shadow-xl bg-white/80 backdrop-blur-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-indigo-600 p-3 rounded-2xl w-fit mb-2 shadow-lg shadow-indigo-200">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Mirai Track</CardTitle>
          <CardDescription className="text-slate-500">
            Transparent Productivity & Attendance System
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <Button 
            onClick={handleLogin} 
            className="w-full h-12 text-lg font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </Button>
          <p className="text-center text-xs text-slate-400 mt-4">
            Secure authentication powered by Google
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
