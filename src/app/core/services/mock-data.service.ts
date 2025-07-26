import { Injectable, signal, computed } from '@angular/core';
import { 
  Appointment, 
  Customer, 
  Professional, 
  TimeSlot,
  AppointmentStatus 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private readonly professionals = signal<Professional[]>(this.generateProfessionals());
  private readonly customers = signal<Customer[]>(this.generateCustomers());
  private readonly appointments = signal<Appointment[]>(this.generateAppointments());
  private readonly timeSlots = signal<TimeSlot[]>(this.generateTimeSlots());

  // Public signals for reading data
  readonly professionals$ = this.professionals.asReadonly();
  readonly customers$ = this.customers.asReadonly();
  readonly appointments$ = this.appointments.asReadonly();
  readonly timeSlots$ = this.timeSlots.asReadonly();

  // Computed signals for derived data
  readonly appointmentsByProfessional = computed(() => {
    const appointments = this.appointments();
    return appointments.reduce((acc, appointment) => {
      if (!acc[appointment.professionalId]) {
        acc[appointment.professionalId] = [];
      }
      acc[appointment.professionalId].push(appointment);
      return acc;
    }, {} as Record<string, Appointment[]>);
  });

  readonly appointmentsByCustomer = computed(() => {
    const appointments = this.appointments();
    return appointments.reduce((acc, appointment) => {
      if (!acc[appointment.customerId]) {
        acc[appointment.customerId] = [];
      }
      acc[appointment.customerId].push(appointment);
      return acc;
    }, {} as Record<string, Appointment[]>);
  });

  // Methods to modify data
  addAppointment(appointment: Appointment): void {
    this.appointments.update(current => [...current, appointment]);
  }

  updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): void {
    this.appointments.update(current => 
      current.map(apt => 
        apt.id === appointmentId ? { ...apt, status } : apt
      )
    );
  }

  cancelAppointment(appointmentId: string): void {
    this.updateAppointmentStatus(appointmentId, 'cancelled');
  }

  // Data generation methods
  private generateProfessionals(): Professional[] {
    return [
      {
        id: 'prof-001',
        name: 'Dr. Sarah Johnson',
        specialty: 'General Medicine',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
      },
      {
        id: 'prof-002',
        name: 'Dr. Michael Chen',
        specialty: 'Dentistry',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
      },
      {
        id: 'prof-003',
        name: 'Emma Williams',
        specialty: 'Hair Stylist',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'
      },
      {
        id: 'prof-004',
        name: 'James Rodriguez',
        specialty: 'Personal Trainer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James'
      },
      {
        id: 'prof-005',
        name: 'Lisa Thompson',
        specialty: 'Massage Therapist',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa'
      }
    ];
  }

  private generateCustomers(): Customer[] {
    return [
      {
        id: 'cust-001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567'
      },
      {
        id: 'cust-002',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1 (555) 234-5678'
      },
      {
        id: 'cust-003',
        name: 'Robert Brown',
        email: 'robert.brown@example.com',
        phone: '+1 (555) 345-6789'
      },
      {
        id: 'cust-004',
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        phone: '+1 (555) 456-7890'
      },
      {
        id: 'cust-005',
        name: 'David Wilson',
        email: 'david.wilson@example.com',
        phone: '+1 (555) 567-8901'
      },
      {
        id: 'cust-006',
        name: 'Sophie Martinez',
        email: 'sophie.martinez@example.com',
        phone: '+1 (555) 678-9012'
      },
      {
        id: 'cust-007',
        name: 'Oliver Anderson',
        email: 'oliver.anderson@example.com',
        phone: '+1 (555) 789-0123'
      },
      {
        id: 'cust-008',
        name: 'Ava Taylor',
        email: 'ava.taylor@example.com',
        phone: '+1 (555) 890-1234'
      },
      {
        id: 'cust-009',
        name: 'William Thomas',
        email: 'william.thomas@example.com',
        phone: '+1 (555) 901-2345'
      },
      {
        id: 'cust-010',
        name: 'Isabella Garcia',
        email: 'isabella.garcia@example.com',
        phone: '+1 (555) 012-3456'
      }
    ];
  }

  private generateAppointments(): Appointment[] {
    const serviceTypes = [
      'General Checkup',
      'Dental Cleaning',
      'Haircut',
      'Personal Training Session',
      'Massage Therapy',
      'Consultation',
      'Treatment',
      'Follow-up'
    ];

    const statuses: AppointmentStatus[] = [
      'scheduled',
      'confirmed',
      'completed',
      'cancelled',
      'no-show'
    ];

    const appointments: Appointment[] = [];
    const professionals = this.generateProfessionals();
    const customers = this.generateCustomers();

    // Generate 20 appointments distributed across different dates and times
    for (let i = 0; i < 20; i++) {
      const professional = professionals[i % professionals.length];
      const customer = customers[i % customers.length];
      const serviceType = serviceTypes[i % serviceTypes.length];
      const status = i < 5 ? 'scheduled' : statuses[i % statuses.length];
      
      // Create appointments spread across the next 30 days
      const daysOffset = Math.floor(i / 2) - 5; // Some past, some future
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
      appointmentDate.setHours(9 + (i % 8), i % 2 === 0 ? 0 : 30, 0, 0);

      appointments.push({
        id: `apt-${String(i + 1).padStart(3, '0')}`,
        serviceType,
        professionalId: professional.id,
        customerId: customer.id,
        startTime: appointmentDate,
        duration: [30, 45, 60, 90][i % 4],
        status
      });
    }

    return appointments;
  }

  private generateTimeSlots(): TimeSlot[] {
    const days: TimeSlot['dayOfWeek'][] = [
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday'
    ];

    return days.flatMap(day => [
      { dayOfWeek: day, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: day, startTime: '14:00', endTime: '18:00' }
    ]);
  }
}