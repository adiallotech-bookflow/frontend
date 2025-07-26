import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../../core/services/calendar';
import { CalendarMonth, CalendarDay, DayAvailability } from '../../core/models';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-calendar',
  imports: [CommonModule],
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
  
  currentDate = signal(new Date());
  selectedDate = signal<Date | null>(null);
  showDayDetails = signal(false);
  selectedDayAvailability = signal<DayAvailability | null>(null);
  
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
  
  isSelected(day: CalendarDay): boolean {
    const selected = this.selectedDate();
    return selected !== null && 
           day.date.getDate() === selected.getDate() &&
           day.date.getMonth() === selected.getMonth() &&
           day.date.getFullYear() === selected.getFullYear();
  }
  
  getDayClasses(day: CalendarDay): string {
    const classes: string[] = [];
    
    if (!day.isCurrentMonth) {
      classes.push('text-gray-400 bg-gray-50');
    } else if (day.isToday) {
      classes.push('font-bold ring-2 ring-indigo-600 ring-offset-2');
    }
    
    if (day.isAvailable && day.isCurrentMonth) {
      classes.push('bg-green-50 text-green-900 hover:bg-green-100 cursor-pointer');
    } else if (day.isCurrentMonth && !day.isWeekend) {
      classes.push('bg-red-50 text-red-900');
    }
    
    if (this.isSelected(day)) {
      classes.push('bg-indigo-600 text-white hover:bg-indigo-700');
    }
    
    return classes.join(' ');
  }
  
  getAvailableSlotCount(day: CalendarDay): number {
    if (!day.isAvailable) return 0;
    
    const availability = this.calendarService.calculateAvailableTimeSlots(day.date);
    return availability.timeSlots.filter(slot => slot.isAvailable).length;
  }
}