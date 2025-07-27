import { Appointment, Professional } from './index';

export interface AppointmentExtended extends Appointment {
  customerName: string;
  customerPhone: string;
  professionalName: string;
  service: string;
  date: string;
  time: string;
  price: number;
  notes?: string;
}

export interface ProfessionalExtended extends Professional {
  specialties: string[];
  rating: number;
  businessName: string;
}

export interface TimeSlotAvailability {
  start: string;
  end: string;
  available: boolean;
}

export interface AppointmentFormData {
  professionalId: string;
  customerId: string;
  service: string;
  date: string;
  time: string;
  duration?: number;
  price?: number;
  notes?: string;
}
