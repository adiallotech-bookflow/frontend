import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger, stagger, query } from '@angular/animations';
import { interval, Subscription } from 'rxjs';
import { formatDistanceToNow, isFuture, addDays, format } from 'date-fns';
import { DashboardAppointment, DashboardStats, DashboardActivity } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
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

    // Update current time every minute for countdown
    this.timeSubscription = interval(60000).subscribe(() => {
      this.currentTime.set(new Date());
    });
  }

  ngOnDestroy() {
    this.timeSubscription?.unsubscribe();
  }

  private loadDashboardData() {
    // Sample data - in real app, this would come from a service
    const now = new Date();

    this.appointments.set([
      {
        id: '1',
        date: addDays(now, 2),
        time: '10:00',
        service: 'Haircut',
        professional: 'Dr. Sarah Johnson',
        professionalAvatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=6366f1&color=fff',
        status: 'upcoming',
        price: 35,
        duration: 30
      },
      {
        id: '2',
        date: addDays(now, 7),
        time: '14:30',
        service: 'Hair Color',
        professional: 'Michael Chen',
        professionalAvatar: 'https://ui-avatars.com/api/?name=Michael+Chen&background=6366f1&color=fff',
        status: 'upcoming',
        price: 85,
        duration: 120
      },
      {
        id: '3',
        date: addDays(now, 14),
        time: '11:00',
        service: 'Facial Treatment',
        professional: 'Emma Wilson',
        professionalAvatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=6366f1&color=fff',
        status: 'upcoming',
        price: 65,
        duration: 60
      }
    ]);

    this.quickStats.set({
      totalBookings: 24,
      thisMonth: 3,
      nextAppointment: addDays(now, 2),
      totalSpent: 1250
    });

    this.recentActivity.set([
      {
        id: '1',
        type: 'booking',
        description: 'Booked Haircut with Dr. Sarah Johnson',
        date: addDays(now, -1)
      },
      {
        id: '2',
        type: 'reschedule',
        description: 'Rescheduled Massage Therapy to next week',
        date: addDays(now, -3)
      },
      {
        id: '3',
        type: 'booking',
        description: 'Booked Hair Color with Michael Chen',
        date: addDays(now, -5)
      },
      {
        id: '4',
        type: 'cancellation',
        description: 'Cancelled Manicure appointment',
        date: addDays(now, -7)
      }
    ]);
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
      // In real app, navigate to reschedule flow
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
}
