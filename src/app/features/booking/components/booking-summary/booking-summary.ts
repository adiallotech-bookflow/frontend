import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingFormData } from '../../../../core/models';
import { format } from 'date-fns';

@Component({
  selector: 'app-booking-summary',
  imports: [CommonModule],
  templateUrl: './booking-summary.html',
  styleUrl: './booking-summary.css'
})
export class BookingSummary {
  bookingData = input.required<BookingFormData>();
  confirmBooking = output<void>();
  goBack = output<void>();

  formatDate(date: Date | null): string {
    if (!date) return '';
    return format(date, 'EEEE, MMMM d, yyyy');
  }

  formatTime(time: string | null): string {
    if (!time) return '';
    return time;
  }

  getTotalPrice(): number {
    return this.bookingData().service?.price || 0;
  }

  onConfirm(): void {
    this.confirmBooking.emit();
  }

  onGoBack(): void {
    this.goBack.emit();
  }
}