import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../../core/services/calendar';
import { NotificationService } from '../../core/services/notification.service';
import { CalendarMonth, CalendarDay, DayAvailability, UserAppointment } from '../../core/models';
import { animate, style, transition, trigger } from '@angular/animations';
import { TimeSlotsSlideOver } from './components/time-slots-slideover/time-slots-slideover';

@Component({
  selector: 'app-calendar',
  imports: [CommonModule, TimeSlotsSlideOver],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  animations: [
    trigger('slideAnimation', [
      transition(':increment', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':decrement', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class Calendar {
  private calendarService = inject(CalendarService);
  private notificationService = inject(NotificationService);

  currentDate = signal(new Date());
  selectedDate = signal<Date | null>(null);
  showDayDetails = signal(false);
  selectedDayAvailability = signal<DayAvailability | null>(null);
  selectedProfessionalId = signal<string>('prof1');
  userAppointments = signal<UserAppointment[]>([]);

  calendarMonth = computed<CalendarMonth>(() => {
    return this.calendarService.generateCalendarGrid(this.currentDate());
  });

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  weekDaysShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  weekDaysFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  constructor() {
    // Set up sample professional availability (9 AM - 5 PM, Monday to Friday, 30 min slots)
    this.calendarService.setProfessionalAvailability([
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 }
    ]);

    // Set up some sample booked slots
    const today = new Date();
    this.calendarService.setBookedSlots(today, ['10:00', '11:00', '14:00']);

    // Set up sample user appointments
    this.loadUserAppointments();
  }

  navigateToPreviousMonth(): void {
    this.currentDate.update(date => this.calendarService.navigateToPreviousMonth(date));
  }

  navigateToNextMonth(): void {
    this.currentDate.update(date => this.calendarService.navigateToNextMonth(date));
  }

  navigateToToday(): void {
    this.currentDate.set(new Date());
  }

  selectDate(day: CalendarDay): void {
    if (!day.isCurrentMonth) {
      // Navigate to the month of the clicked date
      this.currentDate.set(day.date);
      return;
    }

    // Don't allow selection of days with existing appointments or past dates
    if (this.hasUserAppointment(day) || this.isPastDate(day)) {
      return;
    }

    this.selectedDate.set(day.date);

    if (day.isAvailable) {
      const availability = this.calendarService.calculateAvailableTimeSlots(day.date);
      this.selectedDayAvailability.set(availability);
      this.showDayDetails.set(true);
    } else {
      this.selectedDayAvailability.set(null);
      this.showDayDetails.set(false);
    }
  }

  closeDayDetails(): void {
    this.showDayDetails.set(false);
  }

  onTimeSlotSelected(event: any): void {
    console.log('Selected time slot:', event);

    const selectedDateStr = this.selectedDate()?.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Close slideover first
    this.closeDayDetails();

    // Show confirmation after a small delay to allow slideover to close
    setTimeout(() => {
      this.notificationService.showConfirmation(
        'Confirm Booking',
        `Book appointment for ${selectedDateStr} at ${event.time}?`,
        () => {
          if (this.selectedDate()) {
            // Add to user appointments
            const newAppointment: UserAppointment = {
              id: `temp-${Date.now()}`,
              date: this.selectedDate()!,
              time: event.time,
              service: 'Selected Service',
              professional: 'Selected Professional',
              professionalId: this.selectedProfessionalId(),
              status: 'upcoming'
            };

            this.userAppointments.update(appointments => [...appointments, newAppointment]);

            // Show success notification
            this.notificationService.show({
              type: 'success',
              title: 'Booking Confirmed',
              message: `Your appointment has been booked for ${event.time}`,
              autoClose: true,
              duration: 5000
            });
          }
        }
      );
    }, 300);
  }

  isSelected(day: CalendarDay): boolean {
    const selected = this.selectedDate();
    return selected !== null &&
           day.date.getDate() === selected.getDate() &&
           day.date.getMonth() === selected.getMonth() &&
           day.date.getFullYear() === selected.getFullYear();
  }

  getAvailableSlotCount(day: CalendarDay): number {
    if (!day.isAvailable) return 0;

    const availability = this.calendarService.calculateAvailableTimeSlots(day.date);
    return availability.timeSlots.filter(slot => slot.isAvailable).length;
  }

  private loadUserAppointments(): void {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);

    this.userAppointments.set([
      {
        id: '1',
        date: nextWeek,
        time: '10:00',
        service: 'Haircut',
        professional: 'Dr. Sarah Johnson',
        professionalId: 'prof1',
        status: 'upcoming'
      },
      {
        id: '2',
        date: nextMonth,
        time: '14:30',
        service: 'Hair Color',
        professional: 'Michael Chen',
        professionalId: 'prof2',
        status: 'upcoming'
      }
    ]);
  }

  hasUserAppointment(day: CalendarDay): boolean {
    return this.userAppointments().some(apt =>
      apt.date.getDate() === day.date.getDate() &&
      apt.date.getMonth() === day.date.getMonth() &&
      apt.date.getFullYear() === day.date.getFullYear() &&
      apt.status === 'upcoming'
    );
  }

  getUserAppointments(day: CalendarDay): UserAppointment[] {
    return this.userAppointments().filter(apt =>
      apt.date.getDate() === day.date.getDate() &&
      apt.date.getMonth() === day.date.getMonth() &&
      apt.date.getFullYear() === day.date.getFullYear() &&
      apt.status === 'upcoming'
    );
  }

  isPastDate(day: CalendarDay): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate < today;
  }
}
