import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Clock, ShieldAlert, LogOut } from 'lucide-react';
import keycloak from './lib/keycloak';

export default function PendingApproval() {
  const handleLogout = () => {
    keycloak.logout();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none shadow-xl bg-white/80 backdrop-blur-md text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto bg-amber-500 p-3 rounded-2xl w-fit mb-2 shadow-lg shadow-amber-100">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Approval Pending</CardTitle>
          <CardDescription className="text-slate-500">
             Your account is currently waiting for HR authorization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 rounded-xl p-4 flex gap-3 items-start text-left">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 leading-relaxed">
              To ensure platform security, all new members must be manually verified by the HR Super Profile before accessing the dashboard.
            </p>
          </div>
          
          <div className="pt-2">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full h-11 border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out & Try Again Later
            </Button>
          </div>
          
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Mirai Track Security System
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
