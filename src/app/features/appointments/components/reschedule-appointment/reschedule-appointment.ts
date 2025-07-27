import {Component, input, output, signal, CUSTOM_ELEMENTS_SCHEMA, OnInit, effect} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentDetails } from '../../../../core/models';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelectable: boolean;
}

@Component({
  selector: 'app-reschedule-appointment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reschedule-appointment.html',
  styleUrl: './reschedule-appointment.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RescheduleAppointmentComponent implements OnInit {
  appointment = input<AppointmentDetails | null>(null);
  reschedule = output<{ date: string; time: string }>();
  cancel = output<void>();

  selectedDate = signal('');
  selectedTime = signal('');
  availableTimes = signal<string[]>([]);
  
  currentMonth = signal(new Date());
  calendarDays = signal<CalendarDay[]>([]);

  constructor() {
    // Generate available time slots
    const times: string[] = [];
    for (let hour = 9; hour < 18; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    this.availableTimes.set(times);
    
    // Generate calendar when month changes
    effect(() => {
      this.generateCalendar();
    });
  }

  ngOnInit() {
    const apt = this.appointment();
    if (apt) {
      // Set default date to appointment date
      const date = new Date(apt.date);
      this.selectedDate.set(date.toISOString().split('T')[0]);
      this.selectedTime.set(apt.time);
    }
  }

  onReschedule(): void {
    if (this.selectedDate() && this.selectedTime()) {
      this.reschedule.emit({
        date: this.selectedDate(),
        time: this.selectedTime()
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getTimeLabel(time: string): string {
    return time;
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  generateCalendar(): void {
    const month = this.currentMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days: CalendarDay[] = [];
    
    // Add days from previous month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, monthIndex, -i);
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isSelectable: false
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, monthIndex, day);
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
      
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday,
        isSelectable: !isPast
      });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, monthIndex + 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelectable: false
      });
    }
    
    this.calendarDays.set(days);
  }
  
  previousMonth(): void {
    const current = this.currentMonth();
    const newMonth = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    this.currentMonth.set(newMonth);
    this.generateCalendar();
  }
  
  nextMonth(): void {
    const current = this.currentMonth();
    const newMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    this.currentMonth.set(newMonth);
    this.generateCalendar();
  }
  
  getMonthYearDisplay(): string {
    const month = this.currentMonth();
    return month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  
  selectDate(day: CalendarDay): void {
    if (!day.isSelectable) return;
    
    // Format date locally to avoid timezone issues
    const year = day.date.getFullYear();
    const month = (day.date.getMonth() + 1).toString().padStart(2, '0');
    const dayNum = day.date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${dayNum}`;
    
    this.selectedDate.set(dateStr);
  }
  
  isSelectedDate(day: CalendarDay): boolean {
    if (!this.selectedDate()) return false;
    
    const selectedDateStr = this.selectedDate();
    // Format date locally to match selectDate
    const year = day.date.getFullYear();
    const month = (day.date.getMonth() + 1).toString().padStart(2, '0');
    const dayNum = day.date.getDate().toString().padStart(2, '0');
    const dayDateStr = `${year}-${month}-${dayNum}`;
    
    return selectedDateStr === dayDateStr;
  }
}
