import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { animate, style, transition, trigger, stagger, query } from '@angular/animations';
import { interval, Subscription } from 'rxjs';
import { formatDistanceToNow, isFuture, format } from 'date-fns';
import { DashboardAppointment, DashboardStats, DashboardActivity, AppointmentExtended, AppointmentDetails } from '../../core/models';
import { AppointmentsMockService } from '../../core/services/mock';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SlideoverComponent } from '../../shared/components/slideover/slideover';
import { RescheduleAppointmentComponent } from '../appointments/components/reschedule-appointment/reschedule-appointment';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, SlideoverComponent, RescheduleAppointmentComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class Dashboard implements OnInit, OnDestroy {
  private appointmentsService = inject(AppointmentsMockService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private timeSubscription?: Subscription;

  appointments = signal<DashboardAppointment[]>([]);
  quickStats = signal<DashboardStats>({
    totalBookings: 0,
    thisMonth: 0,
    nextAppointment: null,
    totalSpent: 0
  });
  recentActivity = signal<DashboardActivity[]>([]);

  showReschedulePanel = signal(false);
  appointmentToReschedule = signal<AppointmentDetails | null>(null);
  currentTime = signal(new Date());
  
  // Loading state
  isLoading = signal(true);
  loadingTasks = {
    appointments: false,
    stats: false,
    activities: false
  };


  upcomingAppointments = computed(() => {
    return this.appointments()
      .filter(apt => apt.status === 'upcoming' && isFuture(apt.date))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 3);
  });

  ngOnInit() {
    this.loadDashboardData();

    this.timeSubscription = interval(60000).subscribe(() => {
      this.currentTime.set(new Date());
    });
  }

  ngOnDestroy() {
    this.timeSubscription?.unsubscribe();
  }

  getCountdown(date: Date): string {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  formatDate(date: Date): string {
    return format(date, 'EEEE, MMMM d');
  }

  formatActivityDate(date: Date): string {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  getActivityIcon(type: DashboardActivity['type']): string {
    switch (type) {
      case 'booking':
        return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
      case 'cancellation':
        return 'M6 18L18 6M6 6l12 12';
      case 'reschedule':
        return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
    }
  }

  getActivityColor(type: DashboardActivity['type']): string {
    switch (type) {
      case 'booking':
        return 'text-green-600 bg-green-100';
      case 'cancellation':
        return 'text-red-600 bg-red-100';
      case 'reschedule':
        return 'text-yellow-600 bg-yellow-100';
    }
  }

  openCancelDialog(appointment: DashboardAppointment) {
    // Show confirmation notification
    this.notificationService.showConfirmation(
      'Cancel Appointment?',
      `Are you sure you want to cancel your ${appointment.service} appointment on ${this.formatDate(appointment.date)} at ${appointment.time}?`,
      () => {
        // On confirm - cancel the appointment
        this.confirmCancel(appointment);
      },
      () => {
        // On cancel - do nothing, notification will be auto-dismissed
      },
      'danger' // Use red color for the confirm button
    );
  }

  openReschedulePanel(appointment: DashboardAppointment) {
    // Convert DashboardAppointment to AppointmentDetails format
    const appointmentDetails: AppointmentDetails = {
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
      endTime: this.calculateEndTime(appointment.time, appointment.duration),
      service: appointment.service,
      serviceCategory: 'General Services',
      professional: appointment.professional,
      professionalAvatar: appointment.professionalAvatar,
      location: 'Downtown Salon',
      status: appointment.status,
      price: appointment.price,
      duration: appointment.duration,
      notes: '',
      createdAt: new Date()
    };
    this.appointmentToReschedule.set(appointmentDetails);
    this.showReschedulePanel.set(true);
  }

  confirmCancel(appointment: DashboardAppointment) {
    if (appointment) {
      this.appointments.update(apts =>
        apts.map(apt =>
          apt.id === appointment.id ? { ...apt, status: 'cancelled' as const } : apt
        )
      );

      // Add to recent activity
      this.recentActivity.update(activities => [
        {
          id: `activity-${Date.now()}`,
          type: 'cancellation',
          description: `Cancelled ${appointment.service} appointment`,
          date: new Date()
        },
        ...activities
      ]);
    }
  }

  closeReschedulePanel(): void {
    this.showReschedulePanel.set(false);
    this.appointmentToReschedule.set(null);
  }

  rescheduleAppointment(appointmentId: string, newSchedule: { date: string; time: string }): void {
    this.appointmentsService.rescheduleAppointment(appointmentId, newSchedule).subscribe({
      next: () => {
        // Update local state
        this.appointments.update(appointments =>
          appointments.map(apt =>
            apt.id === appointmentId
              ? {
                  ...apt,
                  date: new Date(newSchedule.date),
                  time: newSchedule.time
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

        // Reload data
        this.loadDashboardData();
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

  private loadDashboardData() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    // Set loading state
    this.isLoading.set(true);
    this.loadingTasks = {
      appointments: true,
      stats: true,
      activities: true
    };

    // Load appointments first
    let appointmentsObservable;
    if (currentUser.role === 'customer') {
      appointmentsObservable = this.appointmentsService.getAppointmentsByCustomer(currentUser.id);
    } else if (currentUser.role === 'professional') {
      appointmentsObservable = this.appointmentsService.getAppointmentsByProfessional(currentUser.id);
    } else {
      appointmentsObservable = this.appointmentsService.getUpcomingAppointments(10, currentUser.id, currentUser.role);
    }

    // Load appointments and then stats
    appointmentsObservable.subscribe(appointments => {
      this.mapAppointmentsToDashboard(appointments);
      this.loadingTasks.appointments = false;

      // Load stats after appointments are loaded
      this.appointmentsService.getDashboardStats(currentUser.id, currentUser.role).subscribe(stats => {
        const now = new Date();
        const thisMonthCount = this.appointments().filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear();
        }).length;

        this.quickStats.set({
          totalBookings: stats.totalAppointments,
          thisMonth: thisMonthCount,
          nextAppointment: this.appointments().length > 0 ? this.appointments()[0].date : null,
          totalSpent: stats.totalRevenue
        });
        
        this.loadingTasks.stats = false;
        this.checkLoadingComplete();
      });
    });

    // Generate recent activity from appointments
    this.appointmentsService.getRecentAppointments(5, currentUser.id, currentUser.role).subscribe(appointments => {
      const activities: DashboardActivity[] = appointments.map((apt) => {
        let type: 'booking' | 'reschedule' | 'cancellation' = 'booking';
        let description = `Booked ${apt.service} with ${apt.professionalName}`;

        if (apt.status === 'cancelled') {
          type = 'cancellation';
          description = `Cancelled ${apt.service} appointment`;
        }

        return {
          id: apt.id,
          type,
          description,
          date: new Date(apt.date)
        };
      });

      this.recentActivity.set(activities);
      this.loadingTasks.activities = false;
      this.checkLoadingComplete();
    });
  }

  private checkLoadingComplete(): void {
    if (!this.loadingTasks.appointments && !this.loadingTasks.stats && !this.loadingTasks.activities) {
      this.isLoading.set(false);
    }
  }

  private mapAppointmentsToDashboard(appointments: AppointmentExtended[]) {
    const dashboardAppointments: DashboardAppointment[] = appointments
      .filter(apt => apt.status !== 'cancelled')
      .map(apt => ({
        id: apt.id,
        date: new Date(apt.date),
        time: apt.time,
        service: apt.service,
        professional: apt.professionalName,
        professionalAvatar: `https://ui-avatars.com/api/?name=${apt.professionalName.replace(' ', '+')}&background=6366f1&color=fff`,
        status: 'upcoming' as const,
        price: apt.price,
        duration: apt.duration
      }));

    this.appointments.set(dashboardAppointments);
  }
}
