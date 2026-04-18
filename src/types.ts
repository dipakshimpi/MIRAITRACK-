export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  totalPresent: number;
  totalAbsent: number;
  productivityScore: number;
  status: 'pending' | 'approved';
  is_super_profile: boolean;
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
