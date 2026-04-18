import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { UserProfile } from './types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Check, X, UserCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function ApprovalsManager() {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'pending');
    if (data) setPendingUsers(data as UserProfile[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
    
    // Subscribe to new user signups
    const channel = supabase
      .channel('pending_users')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, () => {
        fetchPending();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAction = async (uid: string, action: 'approve' | 'reject') => {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('uid', uid);

    if (error) {
      toast.error(`Failed to ${action} user`);
    } else {
      toast.success(`User ${action}d successfully`);
      setPendingUsers(prev => prev.filter(u => u.uid !== uid));
    }
  };

  if (loading) return <div className="text-center py-10">Loading approval queue...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Control</h2>
          <p className="text-slate-500 font-medium">Review and authorize new team registrations</p>
        </div>
        <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-bold text-sm">
          {pendingUsers.length} Pending
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            Authorization Queue
          </CardTitle>
          <CardDescription>Only approved users can access the dashboard and submit reports.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="bg-slate-50 p-4 rounded-full w-fit mx-auto">
                <ShieldAlert className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium italic">All caught up! No pending approvals.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead>Member</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.uid} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100">
                          <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold">
                            {user.name?.charAt(0) || user.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{user.name || 'New User'}</span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                       {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAction(user.uid, 'reject')}
                          className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleAction(user.uid, 'approve')}
                          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 shadow-md shadow-green-100"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
