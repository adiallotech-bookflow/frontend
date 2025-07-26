import { Injectable } from '@angular/core';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isWeekend,
  addMonths,
  subMonths,
  getWeek,
  setHours,
  setMinutes,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  addMinutes
} from 'date-fns';
import {
  CalendarDay,
  CalendarWeek,
  CalendarMonth,
  ProfessionalAvailability,
  CalendarTimeSlot,
  DayAvailability,
  DateTimeAvailabilityCheck
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private professionalAvailability: ProfessionalAvailability[] = [];
  private bookedSlots: Map<string, string[]> = new Map();

  setProfessionalAvailability(availability: ProfessionalAvailability[]): void {
    this.professionalAvailability = availability;
  }

  setBookedSlots(date: Date, slots: string[]): void {
    const dateKey = format(date, 'yyyy-MM-dd');
    this.bookedSlots.set(dateKey, slots);
  }

  generateCalendarGrid(date: Date): CalendarMonth {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weeks: CalendarWeek[] = [];
    let currentWeek: CalendarDay[] = [];
    let currentWeekNumber = 0;

    days.forEach((day, index) => {
      const weekNumber = getWeek(day, { weekStartsOn: 1 });
      
      if (currentWeekNumber !== weekNumber && currentWeek.length > 0) {
        weeks.push({
          weekNumber: currentWeekNumber,
          days: currentWeek
        });
        currentWeek = [];
      }
      
      currentWeekNumber = weekNumber;

      const dayOfWeek = day.getDay();
      const hasAvailability = this.professionalAvailability.some(
        availability => availability.dayOfWeek === dayOfWeek
      );

      currentWeek.push({
        date: day,
        dayNumber: day.getDate(),
        isCurrentMonth: isSameMonth(day, date),
        isToday: isToday(day),
        isWeekend: isWeekend(day),
        isAvailable: hasAvailability && isSameMonth(day, date) && !isBefore(day, new Date())
      });
    });

    if (currentWeek.length > 0) {
      weeks.push({
        weekNumber: currentWeekNumber,
        days: currentWeek
      });
    }

    return {
      month: date.getMonth(),
      year: date.getFullYear(),
      weeks,
      name: format(date, 'MMMM yyyy')
    };
  }

  calculateAvailableTimeSlots(date: Date): DayAvailability {
    const dayOfWeek = date.getDay();
    const dateKey = format(date, 'yyyy-MM-dd');
    const bookedSlots = this.bookedSlots.get(dateKey) || [];
    
    const dayAvailability = this.professionalAvailability.find(
      availability => availability.dayOfWeek === dayOfWeek
    );

    if (!dayAvailability) {
      return {
        date,
        timeSlots: []
      };
    }

    const timeSlots: CalendarTimeSlot[] = [];
    const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);
    
    let currentSlot = setMinutes(setHours(date, startHour), startMinute);
    const endTime = setMinutes(setHours(date, endHour), endMinute);

    while (isBefore(currentSlot, endTime)) {
      const slotEnd = addMinutes(currentSlot, dayAvailability.slotDurationMinutes);
      const slotTimeString = format(currentSlot, 'HH:mm');
      
      timeSlots.push({
        startTime: slotTimeString,
        endTime: format(slotEnd, 'HH:mm'),
        isAvailable: !bookedSlots.includes(slotTimeString)
      });

      currentSlot = slotEnd;
    }

    return {
      date,
      timeSlots
    };
  }

  navigateToPreviousMonth(currentDate: Date): Date {
    return subMonths(currentDate, 1);
  }

  navigateToNextMonth(currentDate: Date): Date {
    return addMonths(currentDate, 1);
  }

  isDateTimeAvailable(date: Date, time: string): DateTimeAvailabilityCheck {
    const dayOfWeek = date.getDay();
    const dateKey = format(date, 'yyyy-MM-dd');
    const bookedSlots = this.bookedSlots.get(dateKey) || [];
    
    const dayAvailability = this.professionalAvailability.find(
      availability => availability.dayOfWeek === dayOfWeek
    );

    if (!dayAvailability) {
      return {
        date,
        time,
        isAvailable: false
      };
    }

    const [requestHour, requestMinute] = time.split(':').map(Number);
    const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);
    
    const requestedTime = setMinutes(setHours(date, requestHour), requestMinute);
    const startTime = setMinutes(setHours(date, startHour), startMinute);
    const endTime = setMinutes(setHours(date, endHour), endMinute);

    const isWithinBusinessHours = (isAfter(requestedTime, startTime) || isEqual(requestedTime, startTime)) && 
                                 isBefore(requestedTime, endTime);
    
    const isNotBooked = !bookedSlots.includes(time);
    const isNotInPast = !isBefore(date, new Date());

    return {
      date,
      time,
      isAvailable: isWithinBusinessHours && isNotBooked && isNotInPast
    };
  }

  clearBookedSlots(): void {
    this.bookedSlots.clear();
  }
}