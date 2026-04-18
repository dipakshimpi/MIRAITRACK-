import React, { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { UserProfile } from './types';
import { format, subDays } from 'date-fns';

export default function AttendanceSystem() {
  useEffect(() => {
    const runSystemCheck = async () => {
      // Get the Super Profile info to see if we should run the check
      const { data: { user: authUser } } = await (window as any).keycloak?.tokenParsed ? { data: { user: (window as any).keycloak.tokenParsed } } : { data: { user: null } };
      
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      // Check if we've already run the check today
      const { data: lastCheck } = await supabase.from('system').select('*').eq('id', 'last_absent_check').single();
      
      if (lastCheck && lastCheck.date === todayStr) return;

      console.log("AttendanceSystem: Running daily absence check...");

      // 1. Get all approved users
      const { data: users } = await supabase.from('users').select('*').eq('status', 'approved');
      if (!users) return;

      // 2. Get all reports for yesterday
      const { data: reports } = await supabase.from('reports').select('userId').eq('date', yesterdayStr);
      const submittedUserIds = new Set((reports || []).map(r => r.userId));

      const updates = [];
      for (const user of users) {
        if (!submittedUserIds.has(user.uid)) {
          // Mark as absent
          updates.push(
            supabase.from('attendance').upsert({
              userId: user.uid,
              date: yesterdayStr,
              status: 'absent',
              createdAt: new Date().toISOString()
            }, { onConflict: 'userId,date' })
          );

          // Update user stats
          updates.push(
            supabase.from('users').update({ 
               totalAbsent: (user.totalAbsent || 0) + 1,
               productivityScore: Math.max(0, (user.productivityScore || 0) - 10) // Penalty for missing
            }).eq('uid', user.uid)
          );
        }
      }

      await Promise.all(updates);
      
      // Mark check as done for today
      await supabase.from('system').upsert({ id: 'last_absent_check', date: todayStr });
      console.log("AttendanceSystem: Absence check complete.");
    };

    runSystemCheck();
  }, []);

  return null;
}
