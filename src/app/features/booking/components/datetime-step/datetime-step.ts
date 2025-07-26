import { Component, input, output, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingProfessional, CalendarDay } from '../../../../core/models';
import { CalendarService } from '../../../../core/services/calendar';
import { format, addMonths, subMonths, isSameDay } from 'date-fns';

@Component({
  selector: 'app-datetime-step',
  imports: [CommonModule],
  templateUrl: './datetime-step.html',
  styleUrl: './datetime-step.css'
})
export class DatetimeStep {
  selectedProfessional = input.required<BookingProfessional>();
  selectedDate = input<Date | null>(null);
  selectedTime = input<string | null>(null);
  datetimeSelected = output<{ date: Date; time: string }>();

  private calendarService = inject(CalendarService);

  currentMonth = signal(new Date());
  localSelectedDate = signal<Date | null>(null);
  localSelectedTime = signal<string | null>(null);

  calendarMonth = computed(() => {
    return this.calendarService.generateCalendarGrid(this.currentMonth());
  });

  availableTimeSlots = computed(() => {
    const date = this.localSelectedDate();
    if (!date) return [];

    const availability = this.calendarService.calculateAvailableTimeSlots(date);
    return availability.timeSlots.filter(slot => slot.isAvailable);
  });

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor() {
    // Initialize calendar service with sample availability
    // In a real app, this would come from the selected professional's schedule
    this.calendarService.setProfessionalAvailability([
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 }
    ]);

    // Use effect to sync input values with local state
    effect(() => {
      const inputDate = this.selectedDate();
      if (inputDate) {
        this.localSelectedDate.set(inputDate);
      }
    });

    effect(() => {
      const inputTime = this.selectedTime();
      if (inputTime) {
        this.localSelectedTime.set(inputTime);
      }
    });
  }

  previousMonth(): void {
    this.currentMonth.update(date => subMonths(date, 1));
  }

  nextMonth(): void {
    this.currentMonth.update(date => addMonths(date, 1));
  }

  selectDate(day: CalendarDay): void {
    if (day.isAvailable && day.isCurrentMonth) {
      this.localSelectedDate.set(day.date);
      this.localSelectedTime.set(null);
      this.emitSelection();
    }
  }

  selectTime(time: string): void {
    this.localSelectedTime.set(time);
    this.emitSelection();
  }

  isDateSelected(day: CalendarDay): boolean {
    const selected = this.localSelectedDate();
    return selected !== null && isSameDay(day.date, selected);
  }

  isTimeSelected(time: string): boolean {
    return this.localSelectedTime() === time;
  }

  private emitSelection(): void {
    const date = this.localSelectedDate();
    const time = this.localSelectedTime();

    if (date && time) {
      this.datetimeSelected.emit({ date, time });
    }
  }

  getDayClasses(day: CalendarDay): string {
    const classes: string[] = ['relative py-2 px-3 rounded-lg transition-all duration-200'];

    if (!day.isCurrentMonth) {
      classes.push('text-gray-400');
    } else if (day.isToday) {
      classes.push('font-bold');
    }

    if (day.isAvailable && day.isCurrentMonth) {
      classes.push('hover:bg-indigo-50 cursor-pointer');

      if (this.isDateSelected(day)) {
        classes.push('bg-indigo-600 text-white hover:bg-indigo-700');
      }
    } else if (day.isCurrentMonth) {
      classes.push('text-gray-300 cursor-not-allowed');
    }

    return classes.join(' ');
  }

  formatDate(date: Date): string {
    return format(date, 'EEEE, MMMM d, yyyy');
  }
}
