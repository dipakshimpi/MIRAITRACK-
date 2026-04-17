import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { UserProfile } from './types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Badge } from './components/ui/badge';
import { Trophy, Flame } from 'lucide-react';
import { motion } from 'motion/react';

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('productivityScore', { ascending: false })
        .limit(10);
      if (data) setTopUsers(data as UserProfile[]);
    };

    fetchLeaderboard();

    // Real-time subscription
    const channel = supabase
      .channel('leaderboard_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Leaderboard</h2>
        <p className="text-slate-500 font-medium">Celebrating our most consistent and productive team members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {topUsers.slice(0, 3).map((user, index) => (
          <motion.div
            key={user.uid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`relative overflow-hidden border-none shadow-xl ${
              index === 0 ? 'bg-indigo-600 text-white scale-110 z-10' : 'bg-white text-slate-900'
            }`}>
              {index === 0 && <div className="absolute top-0 right-0 p-4 opacity-20"><Trophy className="w-16 h-16" /></div>}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto relative mb-4">
                  <Avatar className={`h-20 w-20 border-4 ${index === 0 ? 'border-white/30' : 'border-indigo-100'}`}>
                    <AvatarFallback className={index === 0 ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}>
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg font-bold text-sm ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                    index === 1 ? 'bg-slate-300 text-slate-700' : 
                    'bg-amber-600 text-amber-50'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold truncate">{user.name}</CardTitle>
                <CardDescription className={index === 0 ? 'text-indigo-100' : 'text-slate-500'}>
                  {user.productivityScore} Points
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest opacity-60">Present</span>
                    <span className="font-bold">{user.totalPresent}</span>
                  </div>
                  <div className="w-px h-8 bg-current opacity-20" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest opacity-60">Streak</span>
                    <span className="font-bold flex items-center justify-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" /> 5
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {topUsers.slice(3).map((user, index) => (
              <div key={user.uid} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-6 text-sm font-bold text-slate-400">{index + 4}</span>
                  <Avatar className="h-10 w-10 border border-slate-100">
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{user.name}</span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-tighter">Score</p>
                    <p className="font-bold text-indigo-600">{user.productivityScore}</p>
                  </div>
                  <Badge variant="outline" className="border-slate-200 text-slate-500">
                    Top 10%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
