import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { UserProfile, DailyReport } from './types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { TrendingUp } from 'lucide-react';

export default function Analytics() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: reportData } = await supabase.from('reports').select('*');
      if (reportData) setReports(reportData as DailyReport[]);

      const { data: userData } = await supabase.from('users').select('*');
      if (userData) setUsers(userData as UserProfile[]);
    };

    fetchData();

    // Real-time subscriptions
    const reportChannel = supabase
      .channel('analytics_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchData();
      })
      .subscribe();

    const userChannel = supabase
      .channel('analytics_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reportChannel);
      supabase.removeChannel(userChannel);
    };
  }, []);

  // Prepare data for charts
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  }).map(date => format(date, 'yyyy-MM-dd'));

  const submissionTrend = last7Days.map(dateStr => ({
    date: format(new Date(dateStr + 'T00:00:00'), 'MMM dd'),
    count: reports.filter(r => r.date === dateStr).length
  }));

  const teamProductivity = users.map(u => ({
    name: u.name.split(' ')[0],
    score: u.productivityScore || 0
  })).sort((a, b) => b.score - a.score).slice(0, 8);

  const totalPresent = users.reduce((acc, u) => acc + (u.totalPresent || 0), 0);
  const totalAbsent = users.reduce((acc, u) => acc + (u.totalAbsent || 0), 0);
  
  const attendanceData = [
    { name: 'Present', value: totalPresent },
    { name: 'Absent', value: totalAbsent }
  ];
  
  const COLORS = ['#4f46e5', '#f43f5e'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submission Trend */}
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Submission Trend</CardTitle>
            <CardDescription>Reports submitted over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={submissionTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Productivity */}
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Top Performers</CardTitle>
            <CardDescription>Productivity scores across the team</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamProductivity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="score" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Pie */}
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Overall Attendance</CardTitle>
            <CardDescription>Cumulative present vs absent days</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600" />
                <span className="text-xs font-medium text-slate-600">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-xs font-medium text-slate-600">Absent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card className="lg:col-span-2 border-none shadow-lg bg-indigo-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="w-48 h-48" />
          </div>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Organization Health</CardTitle>
            <CardDescription className="text-indigo-100">Monthly performance summary</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-4">
            <div className="space-y-1">
              <p className="text-indigo-200 text-xs uppercase tracking-widest font-bold">Total Reports</p>
              <p className="text-4xl font-black">{reports.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-indigo-200 text-xs uppercase tracking-widest font-bold">Avg Hours</p>
              <p className="text-4xl font-black">7.4</p>
            </div>
            <div className="space-y-1">
              <p className="text-indigo-200 text-xs uppercase tracking-widest font-bold">Consistency</p>
              <p className="text-4xl font-black">92%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
