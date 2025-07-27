import {Component, input, output, signal, CUSTOM_ELEMENTS_SCHEMA, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentDetails } from '../../../../core/models';

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

  constructor() {
    // Generate available time slots
    const times: string[] = [];
    for (let hour = 9; hour < 18; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    this.availableTimes.set(times);
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
    return new Date().toISOString().split('T')[0];
  }
}
