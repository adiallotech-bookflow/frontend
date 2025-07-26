import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DayAvailability } from '../../../../core/models';

@Component({
  selector: 'app-time-slots-slideover',
  imports: [CommonModule],
  templateUrl: './time-slots-slideover.html',
  styleUrl: './time-slots-slideover.css'
})
export class TimeSlotsSlideOver {
  isOpen = input.required<boolean>();
  dayAvailability = input<DayAvailability | null>(null);
  close = output<void>();
  selectTimeSlot = output<string>();

  onClose(): void {
    this.close.emit();
  }

  onSelectTimeSlot(time: string): void {
    this.selectTimeSlot.emit(time);
  }
}