import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { UserProfile, DailyReport } from './types';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Progress } from './components/ui/progress';
import { CheckCircle2, TrendingUp, Users, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [recentReports, setRecentReports] = useState<DailyReport[]>([]);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      const { data: userData } = await supabase.from('users').select('*');
      if (userData) setUsers(userData as UserProfile[]);

      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (reportData) setRecentReports(reportData as DailyReport[]);
    };

    fetchData();

    // Set up real-time subscriptions
    const userSubscription = supabase
      .channel('users_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        setUsers((prev) => {
          if (payload.eventType === 'INSERT') return [...prev, payload.new as UserProfile];
          if (payload.eventType === 'UPDATE') return prev.map(u => u.uid === (payload.new as UserProfile).uid ? (payload.new as UserProfile) : u);
          return prev;
        });
      })
      .subscribe();

    const reportSubscription = supabase
      .channel('reports_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload) => {
        setRecentReports((prev) => [payload.new as DailyReport, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userSubscription);
      supabase.removeChannel(reportSubscription);
    };
  }, []);

  const getTodayStatus = (userId: string) => {
    const report = recentReports.find(r => r.userId === userId && r.date === todayStr);
    return report ? 'submitted' : 'pending';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Members" value={users.length} icon={<Users className="w-5 h-5" />} color="bg-blue-500" />
        <StatCard title="Submitted Today" value={recentReports.filter(r => r.date === todayStr).length} icon={<CheckCircle2 className="w-5 h-5" />} color="bg-green-500" />
        <StatCard title="Pending" value={users.length - recentReports.filter(r => r.date === todayStr).length} icon={<Clock className="w-5 h-5" />} color="bg-amber-500" />
        <StatCard title="Avg Productivity" value="84%" icon={<TrendingUp className="w-5 h-5" />} color="bg-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-lg bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Team Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[250px]">Member</TableHead>
                  <TableHead>Today</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.uid} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-slate-900">{user.name}</span>
                          <span className="text-xs text-slate-400">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTodayStatus(user.uid) === 'submitted' ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Submitted
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none px-2 py-0.5">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={user.productivityScore || 0} className="h-1.5 w-16 bg-slate-100" />
                        <span className="text-sm font-semibold text-slate-700">{user.productivityScore || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex gap-2 text-xs font-medium">
                          <span className="text-green-600">P: {user.totalPresent || 0}</span>
                          <span className="text-red-500">A: {user.totalAbsent || 0}</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentReports.map((report) => (
                <div key={report.id} className="relative pl-6 border-l-2 border-slate-100 pb-2 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-500" />
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-slate-900">{report.userName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{format(new Date(report.createdAt), 'HH:mm')}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-md italic">
                      "{report.tasks}"
                    </p>
                  </div>
                </div>
              ))}
              {recentReports.length === 0 && (
                <div className="text-center py-8 text-slate-400 italic text-sm">
                  No reports submitted yet today.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-3 rounded-xl text-white ${color} shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
