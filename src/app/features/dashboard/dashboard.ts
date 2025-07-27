import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { animate, style, transition, trigger, stagger, query } from '@angular/animations';
import { interval, Subscription } from 'rxjs';
import { formatDistanceToNow, isFuture, format } from 'date-fns';
import { DashboardAppointment, DashboardStats, DashboardActivity, AppointmentExtended } from '../../core/models';
import { AppointmentsMockService } from '../../core/services/mock';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
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

  appointments = signal<DashboardAppointment[]>([]);
  quickStats = signal<DashboardStats>({
    totalBookings: 0,
    thisMonth: 0,
    nextAppointment: null,
    totalSpent: 0
  });
  recentActivity = signal<DashboardActivity[]>([]);

  showCancelDialog = signal(false);
  showRescheduleDialog = signal(false);
  selectedAppointment = signal<DashboardAppointment | null>(null);
  currentTime = signal(new Date());

  private timeSubscription?: Subscription;

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
    this.selectedAppointment.set(appointment);
    this.showCancelDialog.set(true);
  }

  openRescheduleDialog(appointment: DashboardAppointment) {
    this.selectedAppointment.set(appointment);
    this.showRescheduleDialog.set(true);
  }

  confirmCancel() {
    const appointment = this.selectedAppointment();
    if (appointment) {
      // In real app, call service to cancel appointment
      console.log('Cancelling appointment:', appointment.id);

      // Update appointment status
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

    this.showCancelDialog.set(false);
    this.selectedAppointment.set(null);
  }

  confirmReschedule() {
    const appointment = this.selectedAppointment();
    if (appointment) {
      console.log('Rescheduling appointment:', appointment.id);
    }

    this.showRescheduleDialog.set(false);
    this.selectedAppointment.set(null);
  }

  closeDialog() {
    this.showCancelDialog.set(false);
    this.showRescheduleDialog.set(false);
    this.selectedAppointment.set(null);
  }

  private loadDashboardData() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    // Load appointments based on user role
    if (currentUser.role === 'customer') {
      // Load customer's appointments
      this.appointmentsService.getAppointmentsByCustomer(currentUser.id).subscribe(appointments => {
        this.mapAppointmentsToDashboard(appointments);
      });
    } else if (currentUser.role === 'professional') {
      // Load professional's appointments
      this.appointmentsService.getAppointmentsByProfessional(currentUser.id).subscribe(appointments => {
        this.mapAppointmentsToDashboard(appointments);
      });
    } else {
      // Admin: load all upcoming appointments
      this.appointmentsService.getUpcomingAppointments(10).subscribe(appointments => {
        this.mapAppointmentsToDashboard(appointments);
      });
    }

    // Load dashboard stats
    this.appointmentsService.getDashboardStats().subscribe(stats => {
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
    });

    // Generate recent activity from appointments
    this.appointmentsService.getRecentAppointments(5).subscribe(appointments => {
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
    });
  }

  private mapAppointmentsToDashboard(appointments: AppointmentExtended[]) {
    const dashboardAppointments: DashboardAppointment[] = appointments
      .filter(apt => apt.status !== 'cancelled' && new Date(apt.date) > new Date())
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
