export interface UserAppointment {
  id: string;
  date: Date;
  time: string;
  service: string;
  professional: string;
  professionalId: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}
