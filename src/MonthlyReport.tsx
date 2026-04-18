import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { UserProfile, DailyReport } from './types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Trophy, Calendar, FileDown, TrendingUp, Award } from 'lucide-react';

export default function MonthlyReport() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentMonth = format(new Date(), 'MMMM yyyy');
  const monthStart = startOfMonth(new Date()).toISOString();
  const monthEnd = endOfMonth(new Date()).toISOString();

  useEffect(() => {
    const fetchMonthlyStats = async () => {
      setLoading(true);
      
      // 1. Fetch all approved users
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'approved');

      // 2. Fetch all reports for the current month
      const { data: reports } = await supabase
        .from('reports')
        .select('*')
        .gte('createdAt', monthStart)
        .lte('createdAt', monthEnd);

      if (users && reports) {
        const stats = users.map(user => {
          const userReports = (reports as DailyReport[]).filter(r => r.userId === user.uid);
          const totalHours = userReports.reduce((acc, r) => acc + (r.hours || 0), 0);
          const avgHours = userReports.length > 0 ? (totalHours / userReports.length).toFixed(1) : 0;
          
          return {
            ...user,
            submissions: userReports.length,
            avgHours,
            totalHours
          };
        }).sort((a, b) => b.productivityScore - a.productivityScore);

        setReportData(stats);
      }
      setLoading(false);
    };

    fetchMonthlyStats();
  }, [monthStart, monthEnd]);

  if (loading) return <div className="text-center py-10">Compiling monthly metrics...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-indigo-600 mb-2 uppercase tracking-tighter">Administrative View</Badge>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">{currentMonth} Report</h2>
          <p className="text-slate-500 font-medium">Final performance summary and rankings for the team</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-6 shadow-xl shadow-slate-200">
          <FileDown className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">Top Performer</span>
            </div>
            <h3 className="text-xl font-bold">{reportData[0]?.name || 'N/A'}</h3>
            <p className="text-3xl font-black mt-2">{reportData[0]?.productivityScore || 0} pts</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Team Avg Score</span>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {(reportData.reduce((acc, u) => acc + u.productivityScore, 0) / (reportData.length || 1)).toFixed(0)}
            </p>
            <p className="text-xs font-medium text-slate-400 mt-2">Active tracked members: {reportData.length}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Best Consistency</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{reportData.sort((a,b) => b.submissions - a.submissions)[0]?.name || 'N/A'}</h3>
            <p className="text-xs font-medium text-slate-400 mt-2">Perfect attendance this month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-none">
              <TableHead className="w-16 text-center font-black text-[10px] uppercase text-slate-400">Rank</TableHead>
              <TableHead className="font-bold text-slate-900">Member</TableHead>
              <TableHead className="text-center font-bold text-slate-900">Submissions</TableHead>
              <TableHead className="text-center font-bold text-slate-900">Avg Hours</TableHead>
              <TableHead className="text-right font-bold text-slate-900 pr-8">Productivity Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.map((user, index) => (
              <TableRow key={user.uid} className="group hover:bg-slate-50 transition-colors border-slate-50">
                <TableCell className="text-center">
                   <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-black text-sm ${
                     index === 0 ? 'bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-100' :
                     index === 1 ? 'bg-slate-200 text-slate-600' :
                     index === 2 ? 'bg-amber-100 text-amber-700' :
                     'text-slate-400'
                   }`}>
                     {index + 1}
                   </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{user.name}</span>
                    <span className="text-xs text-slate-400">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium text-slate-600">{user.submissions} days</TableCell>
                <TableCell className="text-center font-medium text-slate-600">{user.avgHours} hrs</TableCell>
                <TableCell className="text-right pr-8">
                   <span className="text-lg font-black text-indigo-600">{user.productivityScore}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
