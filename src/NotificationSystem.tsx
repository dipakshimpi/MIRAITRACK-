import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, AlertTriangle, Clock } from 'lucide-react';
import { format, isAfter, setHours, setMinutes, startOfToday } from 'date-fns';

export default function NotificationSystem() {
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const alertTime = setMinutes(setHours(startOfToday(), 23), 30); // 11:30 PM
      const deadlineTime = setMinutes(setHours(startOfToday(), 23), 59); // 11:59 PM

      // If it's between 11:30 PM and 11:59 PM and we haven't notified yet
      if (isAfter(now, alertTime) && !isAfter(now, deadlineTime) && !hasNotified) {
        toast("Deadline Reminder", {
          description: "It's 11:30 PM! Please submit your daily report before the 11:59 PM deadline.",
          icon: <Bell className="w-4 h-4 text-amber-500" />,
          duration: 10000,
          action: {
            label: "Submit Now",
            onClick: () => {
              // This would ideally trigger a tab change, but for now just a toast
              console.log("Submit clicked");
            }
          }
        });
        setHasNotified(true);
      }

      // Reset notification state at the start of a new day
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setHasNotified(false);
      }
    };

    const interval = setInterval(checkTime, 60000); // Check every minute
    checkTime(); // Initial check

    return () => clearInterval(interval);
  }, [hasNotified]);

  return null;
}
