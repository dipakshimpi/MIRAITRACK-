import { format, setHours, setMinutes, startOfToday, addMinutes } from 'date-fns';

export async function syncDeadlineEvent() {
  const token = localStorage.getItem('google_calendar_token');
  if (!token) {
    console.warn("No Google Calendar token found. Please sign in again.");
    return { success: false, error: 'No token' };
  }

  try {
    const today = startOfToday();
    const start = setMinutes(setHours(today, 23), 59);
    const end = addMinutes(start, 1);

    const event = {
      summary: 'Mirai Track: Submission Deadline',
      description: 'Daily productivity report submission deadline. Please submit your tasks in the Mirai Track app.',
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 29 }, // 11:30 PM alert
          { method: 'email', minutes: 29 },
        ],
      },
    };

    // 1. Check if event already exists for today
    const listResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${today.toISOString()}&q=Mirai Track`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!listResponse.ok) {
      if (listResponse.status === 401) {
        localStorage.removeItem('google_calendar_token');
        return { success: false, error: 'Unauthorized' };
      }
      throw new Error('Failed to fetch events');
    }

    const listData = await listResponse.json();
    const existingEvent = listData.items?.find((item: any) => 
      item.summary === 'Mirai Track: Submission Deadline' && 
      item.start.dateTime.startsWith(format(today, 'yyyy-MM-dd'))
    );

    if (existingEvent) {
      return { success: true, message: 'Event already exists' };
    }

    // 2. Create the event
    const createResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!createResponse.ok) {
      throw new Error('Failed to create event');
    }

    return { success: true, message: 'Event created successfully' };
  } catch (error) {
    console.error('Calendar sync error:', error);
    return { success: false, error: 'Sync failed' };
  }
}
