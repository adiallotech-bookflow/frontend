import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentDetails, AppointmentFilter, AppointmentStats } from '../../core/models';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-appointments',
  imports: [CommonModule],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css',
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('50ms', [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class Appointments {
  appointments = signal<AppointmentDetails[]>([]);
  filter = signal<AppointmentFilter>({ status: 'all', dateRange: 'all' });
  searchTerm = signal('');

  filteredAppointments = computed(() => {
    const allAppointments = this.appointments();
    const currentFilter = this.filter();
    const search = this.searchTerm().toLowerCase();

    return allAppointments.filter(appointment => {
      // Status filter
      if (currentFilter.status && currentFilter.status !== 'all' && appointment.status !== currentFilter.status) {
        return false;
      }

      // Search filter
      if (search && !appointment.service.toLowerCase().includes(search) && 
          !appointment.professional.toLowerCase().includes(search)) {
        return false;
      }

      // Date range filter
      if (currentFilter.dateRange && currentFilter.dateRange !== 'all') {
        const appointmentDate = new Date(appointment.date);
        const now = new Date();
        
        switch (currentFilter.dateRange) {
          case 'this-week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return appointmentDate >= weekStart && appointmentDate <= weekEnd;
          
          case 'this-month':
            return appointmentDate.getMonth() === now.getMonth() && 
                   appointmentDate.getFullYear() === now.getFullYear();
          
          case 'last-month':
            const lastMonth = new Date(now);
            lastMonth.setMonth(now.getMonth() - 1);
            return appointmentDate.getMonth() === lastMonth.getMonth() && 
                   appointmentDate.getFullYear() === lastMonth.getFullYear();
        }
      }

      return true;
    });
  });

  stats = computed<AppointmentStats>(() => {
    const all = this.appointments();
    return {
      total: all.length,
      upcoming: all.filter(a => a.status === 'upcoming').length,
      completed: all.filter(a => a.status === 'completed').length,
      cancelled: all.filter(a => a.status === 'cancelled').length
    };
  });

  constructor() {
    this.loadAppointments();
  }

  private loadAppointments(): void {
    const now = new Date();
    const mockAppointments: AppointmentDetails[] = [
      {
        id: '1',
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        time: '10:00',
        endTime: '11:00',
        service: 'Haircut & Style',
        serviceCategory: 'Hair Services',
        professional: 'Sarah Johnson',
        professionalAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        location: 'Downtown Salon',
        status: 'upcoming',
        price: 75,
        duration: 60,
        notes: 'Regular trim and styling',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        time: '14:00',
        endTime: '15:30',
        service: 'Deep Tissue Massage',
        serviceCategory: 'Wellness',
        professional: 'Michael Chen',
        professionalAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
        location: 'Wellness Center',
        status: 'completed',
        price: 120,
        duration: 90,
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        time: '09:00',
        endTime: '10:00',
        service: 'Dental Checkup',
        serviceCategory: 'Healthcare',
        professional: 'Dr. Emily Davis',
        professionalAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
        location: 'City Dental Clinic',
        status: 'upcoming',
        price: 150,
        duration: 60,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: '4',
        date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        time: '16:00',
        endTime: '17:00',
        service: 'Personal Training',
        serviceCategory: 'Fitness',
        professional: 'James Wilson',
        professionalAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
        location: 'FitZone Gym',
        status: 'cancelled',
        price: 80,
        duration: 60,
        createdAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)
      }
    ];

    this.appointments.set(mockAppointments);
  }

  updateFilter(newFilter: Partial<AppointmentFilter>): void {
    this.filter.update(current => ({ ...current, ...newFilter }));
  }

  cancelAppointment(id: string): void {
    this.appointments.update(appointments =>
      appointments.map(apt =>
        apt.id === id ? { ...apt, status: 'cancelled' as const } : apt
      )
    );
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      case 'no-show': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}