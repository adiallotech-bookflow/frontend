export interface AppointmentDetails {
  id: string;
  date: Date;
  time: string;
  endTime: string;
  service: string;
  serviceCategory: string;
  professional: string;
  professionalAvatar: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'no-show';
  price: number;
  duration: number;
  notes?: string;
  createdAt: Date;
}

export interface AppointmentFilter {
  status?: 'all' | 'upcoming' | 'completed' | 'cancelled';
  dateRange?: 'all' | 'this-week' | 'this-month' | 'last-month' | 'custom';
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

export interface AppointmentStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}