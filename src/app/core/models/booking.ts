export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  categoryId: string;
}

export interface BookingProfessional {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
}

export interface BookingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface BookingFormData {
  service: Service | null;
  professional: BookingProfessional | null;
  date: Date | null;
  time: string | null;
  details: BookingDetails | null;
}

export interface BookingStep {
  id: number;
  name: string;
  label: string;
  completed: boolean;
  active: boolean;
}

export type StepName = 'service' | 'professional' | 'datetime' | 'details' | 'summary';