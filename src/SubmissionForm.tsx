import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { UserProfile } from './types';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { syncDeadlineEvent } from './lib/CalendarService';
import { toast } from 'sonner';
import { CheckCircle2, Send, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface SubmissionFormProps {
  user: UserProfile;
}

export default function SubmissionForm({ user }: SubmissionFormProps) {
  const [tasks, setTasks] = useState('');
  const [hours, setHours] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const handleSyncCalendar = async () => {
    setSyncing(true);
    const result = await syncDeadlineEvent();
    if (result.success) {
      toast.success("Calendar Synced", {
        description: "Deadline reminder added to your Google Calendar for 11:30 PM."
      });
    } else {
      toast.error("Sync Failed", {
        description: result.error === 'Unauthorized' ? "Please sign out and sign in again to grant calendar permissions." : "Could not sync with Google Calendar."
      });
    }
    setSyncing(false);
  };

  useEffect(() => {
    const checkExisting = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id')
        .eq('userId', user.uid)
        .eq('date', todayStr);
      
      if (data && data.length > 0) {
        setSubmitted(true);
      }
    };
    checkExisting();
  }, [user.uid, todayStr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasks.trim()) return;

    setLoading(true);
    setError('');

    try {
      // 1. Save Report
      const { error: reportError } = await supabase.from('reports').insert([{
        userId: user.uid,
        userName: user.name,
        date: todayStr,
        tasks,
        hours: Number(hours) || 0,
        remarks,
        createdAt: new Date().toISOString()
      }]);

      if (reportError) throw reportError;

      // 2. Mark Attendance as Present
      const { error: attendanceError } = await supabase.from('attendance').upsert([{
        userId: user.uid,
        date: todayStr,
        status: 'present',
        createdAt: new Date().toISOString()
      }], { onConflict: 'userId,date' });

      if (attendanceError) throw attendanceError;

      // 3. Update User Stats
      const { data: userData } = await supabase.from('users').select('*').eq('uid', user.uid).single();
      if (userData) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            totalPresent: (userData.totalPresent || 0) + 1,
            productivityScore: Math.min(100, (userData.productivityScore || 0) + 5)
          })
          .eq('uid', user.uid);
        
        if (updateError) throw updateError;
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-none shadow-lg bg-green-50/50 backdrop-blur-sm">
        <CardContent className="pt-10 pb-10 text-center space-y-4">
          <div className="mx-auto bg-green-500 p-3 rounded-full w-fit shadow-lg shadow-green-100">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-green-800">Report Submitted!</CardTitle>
          <CardDescription className="text-green-600 font-medium">
            Great job today, {user.name.split(' ')[0]}! Your attendance is marked as present.
          </CardDescription>
          <p className="text-xs text-green-500 italic">You can view your submission in the dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-slate-900">Daily Work Report</CardTitle>
        <div className="flex justify-between items-center">
          <CardDescription>
            Submit your tasks for {format(new Date(), 'EEEE, MMMM do')}
          </CardDescription>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSyncCalendar}
            disabled={syncing}
            className="text-xs font-bold text-indigo-600 border-indigo-100 hover:bg-indigo-50"
          >
            <CalendarIcon className="w-3 h-3 mr-2" />
            {syncing ? 'Syncing...' : 'Sync Deadline to Calendar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tasks" className="text-sm font-semibold text-slate-700">Tasks Completed Today *</Label>
            <Textarea 
              id="tasks"
              placeholder="What did you achieve today?"
              className="min-h-[120px] bg-white/80 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hours" className="text-sm font-semibold text-slate-700">Hours Worked</Label>
              <Input 
                id="hours"
                type="number"
                placeholder="e.g. 8"
                className="bg-white/80 border-slate-200"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks" className="text-sm font-semibold text-slate-700">Remarks / Blockers</Label>
              <Input 
                id="remarks"
                placeholder="Any issues?"
                className="bg-white/80 border-slate-200"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
          >
            {loading ? 'Submitting...' : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Daily Report
              </>
            )}
          </Button>
          
          <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Deadline: 11:59 PM • Alert at 11:30 PM
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
