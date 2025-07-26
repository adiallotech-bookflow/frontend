export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isAvailable: boolean;
}

export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

export interface CalendarMonth {
  month: number;
  year: number;
  weeks: CalendarWeek[];
  name: string;
}

export interface CalendarTimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface DayAvailability {
  date: Date;
  timeSlots: CalendarTimeSlot[];
}

export interface ProfessionalAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface DateTimeAvailabilityCheck {
  date: Date;
  time: string;
  isAvailable: boolean;
}