export interface DashboardAppointment {
  id: string;
  date: Date;
  time: string;
  service: string;
  professional: string;
  professionalAvatar: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
  duration: number;
}

export interface DashboardStats {
  totalBookings: number;
  thisMonth: number;
  nextAppointment: Date | null;
  totalSpent: number;
}

export interface DashboardActivity {
  id: string;
  type: 'booking' | 'cancellation' | 'reschedule';
  description: string;
  date: Date;
}