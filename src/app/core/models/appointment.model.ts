export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export interface Appointment {
  id: string;
  serviceType: string;
  professionalId: string;
  customerId: string;
  startTime: Date;
  duration: number; // in minutes
  status: AppointmentStatus;
}