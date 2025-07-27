import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentDetails, AppointmentFilter, AppointmentStats } from '../../core/models';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { AppointmentsMockService } from '../../core/services/mock';
import { AuthService } from '../../core/services/auth.service';
import { map } from 'rxjs/operators';

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
export class Appointments implements OnInit {
  private appointmentsService = inject(AppointmentsMockService);
  private authService = inject(AuthService);
  appointments = signal<AppointmentDetails[]>([]);
  filter = signal<AppointmentFilter>({ status: 'all', dateRange: 'all' });
  searchTerm = signal('');
  stats = signal<AppointmentStats>({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0
  });
  
  // Loading state
  isLoading = signal(true);

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


  ngOnInit(): void {
    this.isLoading.set(true);
    this.loadAppointments();
    this.loadStats();
  }

  private loadStats(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.appointmentsService.getDashboardStats(currentUser.id, currentUser.role).subscribe(stats => {
      this.stats.set({
        total: stats.totalAppointments,
        upcoming: stats.upcomingAppointments,
        completed: stats.completedAppointments,
        cancelled: stats.cancelledAppointments
      });
    });
  }

  private loadAppointments(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    // Load appointments based on user role
    let appointmentsObservable;
    if (currentUser.role === 'customer') {
      appointmentsObservable = this.appointmentsService.getAppointmentsByCustomer(currentUser.id);
    } else if (currentUser.role === 'professional') {
      appointmentsObservable = this.appointmentsService.getAppointmentsByProfessional(currentUser.id);
    } else {
      // Admin sees all appointments
      appointmentsObservable = this.appointmentsService.getAppointments();
    }

    appointmentsObservable.pipe(
      map(appointments => 
        appointments.map(apt => {
          const startTime = new Date(apt.date + 'T' + apt.time);
          const endTime = new Date(startTime.getTime() + apt.duration * 60000);
          
          // Map status to AppointmentDetails status type
          let status: AppointmentDetails['status'];
          switch (apt.status) {
            case 'scheduled':
            case 'confirmed':
              status = 'upcoming';
              break;
            case 'completed':
              status = 'completed';
              break;
            case 'cancelled':
              status = 'cancelled';
              break;
            default:
              status = 'upcoming';
          }
          
          // Map to AppointmentDetails interface
          const appointmentDetails: AppointmentDetails = {
            id: apt.id,
            date: new Date(apt.date),
            time: apt.time,
            endTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
            service: apt.service,
            serviceCategory: this.getServiceCategory(apt.service),
            professional: apt.professionalName,
            professionalAvatar: `https://ui-avatars.com/api/?name=${apt.professionalName.replace(' ', '+')}&background=6366f1&color=fff`,
            location: 'Downtown Salon', // Default location
            status,
            price: apt.price,
            duration: apt.duration,
            notes: apt.notes,
            createdAt: new Date() // We don't have created date in the mock
          };
          
          return appointmentDetails;
        })
      )
    ).subscribe(appointments => {
      this.appointments.set(appointments);
      this.isLoading.set(false);
    });
  }

  private getServiceCategory(service: string): string {
    // Map services to categories
    const categories: { [key: string]: string } = {
      'Men\'s Haircut': 'Hair Services',
      'Women\'s Haircut': 'Hair Services',
      'Hair Coloring': 'Hair Services',
      'Highlights': 'Hair Services',
      'Blowout': 'Hair Services',
      'Beard Trim': 'Hair Services',
      'Hair Treatment': 'Hair Services',
      'Wedding Hair': 'Hair Services',
      'Perm': 'Hair Services',
      'Hair Straightening': 'Hair Services'
    };
    return categories[service] || 'General Services';
  }

  updateFilter(newFilter: Partial<AppointmentFilter>): void {
    this.filter.update(current => ({ ...current, ...newFilter }));
  }

  cancelAppointment(id: string): void {
    this.appointmentsService.cancelAppointment(id).subscribe({
      next: () => {
        // Update local state
        this.appointments.update(appointments =>
          appointments.map(apt =>
            apt.id === id ? { ...apt, status: 'cancelled' as const } : apt
          )
        );
        // Reload stats to reflect the change
        this.loadStats();
      },
      error: (error) => {
        console.error('Error cancelling appointment:', error);
      }
    });
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