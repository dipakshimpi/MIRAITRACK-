export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  totalPresent: number;
  totalAbsent: number;
  productivityScore: number;
}


export interface DailyReport {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  tasks: string;
  hours: number;
  remarks: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent';
  createdAt: string;
}
