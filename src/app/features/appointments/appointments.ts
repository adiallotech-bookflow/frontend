import { Component, signal, computed, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentDetails, AppointmentFilter, AppointmentStats } from '../../core/models';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { AppointmentsMockService } from '../../core/services/mock';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { map } from 'rxjs/operators';
import { SlideoverComponent } from '../../shared/components/slideover/slideover';
import { RescheduleAppointmentComponent } from './components/reschedule-appointment/reschedule-appointment';

@Component({
  selector: 'app-appointments',
  imports: [CommonModule, SlideoverComponent, RescheduleAppointmentComponent],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
  private notificationService = inject(NotificationService);
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

  // Reschedule state
  showReschedulePanel = signal(false);
  appointmentToReschedule = signal<AppointmentDetails | null>(null);

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

  groupedAppointments = computed(() => {
    const filtered = this.filteredAppointments();
    const groups: {
      upcoming: AppointmentDetails[];
      completed: AppointmentDetails[];
      cancelled: AppointmentDetails[];
    } = {
      upcoming: [],
      completed: [],
      cancelled: []
    };

    filtered.forEach(appointment => {
      switch (appointment.status) {
        case 'upcoming':
          groups.upcoming.push(appointment);
          break;
        case 'completed':
          groups.completed.push(appointment);
          break;
        case 'cancelled':
          groups.cancelled.push(appointment);
          break;
      }
    });

    // Sort appointments within each group by date
    const sortByDateTime = (a: AppointmentDetails, b: AppointmentDetails) => {
      const dateA = new Date(a.date);
      const [hoursA, minutesA] = a.time.split(':').map(Number);
      dateA.setHours(hoursA, minutesA);

      const dateB = new Date(b.date);
      const [hoursB, minutesB] = b.time.split(':').map(Number);
      dateB.setHours(hoursB, minutesB);

      return dateA.getTime() - dateB.getTime();
    };

    groups.upcoming.sort(sortByDateTime);
    groups.completed.sort(sortByDateTime);
    groups.cancelled.sort(sortByDateTime);

    return groups;
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
          // Parse the date properly - apt.date is already an ISO string
          const appointmentDate = new Date(apt.date);
          const [hours, minutes] = apt.time.split(':').map(Number);
          const startTime = new Date(appointmentDate);
          startTime.setHours(hours, minutes, 0, 0);
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
    const appointment = this.appointments().find(apt => apt.id === id);
    if (!appointment) return;

    // Show confirmation notification
    this.notificationService.showConfirmation(
      'Cancel Appointment?',
      `Are you sure you want to cancel your ${appointment.service} appointment on ${this.formatDate(appointment.date)} at ${appointment.time}?`,
      () => {
        this.proceedWithCancellation(id);
      },
      () => {
        // On cancel - do nothing, notification will be auto-dismissed
      },
      'danger' // Use red color for the confirm button
    );
  }

  private proceedWithCancellation(id: string): void {
    this.appointmentsService.cancelAppointment(id).subscribe({
      next: () => {
        // Update local state
        this.appointments.update(appointments =>
          appointments.map(apt =>
            apt.id === id ? { ...apt, status: 'cancelled' as const } : apt
          )
        );

        // Show success notification
        this.notificationService.show({
          type: 'success',
          title: 'Appointment Cancelled',
          message: 'Your appointment has been successfully cancelled.',
          autoClose: true,
          duration: 5000
        });

        // Reload stats to reflect the change
        this.loadStats();
      },
      error: (error) => {
        console.error('Error cancelling appointment:', error);
        // Show error notification
        this.notificationService.show({
          type: 'error',
          title: 'Cancellation Failed',
          message: 'Unable to cancel the appointment. Please try again.',
          autoClose: true,
          duration: 5000
        });
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

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'all': return 'All Status';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'All Status';
    }
  }

  getDateRangeLabel(dateRange: string | undefined): string {
    switch (dateRange) {
      case 'all': return 'All Time';
      case 'this-week': return 'This Week';
      case 'this-month': return 'This Month';
      case 'last-month': return 'Last Month';
      default: return 'All Time';
    }
  }

  filters() {
    return this.filter();
  }

  openReschedulePanel(appointment: AppointmentDetails): void {
    this.appointmentToReschedule.set(appointment);
    this.showReschedulePanel.set(true);
  }

  closeReschedulePanel(): void {
    this.showReschedulePanel.set(false);
    this.appointmentToReschedule.set(null);
  }

  rescheduleAppointment(appointmentId: string, newSchedule: { date: string; time: string }): void {
    const appointment = this.appointments().find(apt => apt.id === appointmentId);
    if (!appointment) return;

    // Call the service to persist the change
    this.appointmentsService.rescheduleAppointment(appointmentId, newSchedule).subscribe({
      next: () => {
        // Update local state with the response
        this.appointments.update(appointments =>
          appointments.map(apt =>
            apt.id === appointmentId
              ? {
                  ...apt,
                  date: new Date(newSchedule.date),
                  time: newSchedule.time,
                  // Calculate new end time
                  endTime: this.calculateEndTime(newSchedule.time, apt.duration)
                }
              : apt
          )
        );

        // Close the panel
        this.closeReschedulePanel();

        // Show success notification
        this.notificationService.show({
          type: 'success',
          title: 'Appointment Rescheduled',
          message: `Your appointment has been successfully rescheduled to ${new Date(newSchedule.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${newSchedule.time}.`,
          autoClose: true,
          duration: 5000
        });

        // Reload stats to reflect any changes
        this.loadStats();
      },
      error: (error) => {
        console.error('Error rescheduling appointment:', error);
        // Show error notification
        this.notificationService.show({
          type: 'error',
          title: 'Reschedule Failed',
          message: 'Unable to reschedule the appointment. Please try again.',
          autoClose: true,
          duration: 5000
        });
      }
    });
  }

  private calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }
}
