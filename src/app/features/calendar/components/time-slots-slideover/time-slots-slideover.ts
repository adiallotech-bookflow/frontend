import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  DayAvailability, 
  CalendarTimeSlot, 
  GroupedSlots, 
  SlotSelectionEvent 
} from '../../../../core/models';

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
  selectTimeSlot = output<SlotSelectionEvent>();

  groupedSlots = computed<GroupedSlots>(() => {
    const availability = this.dayAvailability();
    if (!availability || !availability.timeSlots) {
      return { morning: [], afternoon: [], evening: [] };
    }

    const grouped: GroupedSlots = {
      morning: [],
      afternoon: [],
      evening: []
    };

    availability.timeSlots.forEach(slot => {
      const hour = parseInt(slot.startTime.split(':')[0]);
      
      if (hour < 12) {
        grouped.morning.push(slot);
      } else if (hour < 17) {
        grouped.afternoon.push(slot);
      } else {
        grouped.evening.push(slot);
      }
    });

    return grouped;
  });

  hasSlots = computed(() => {
    const grouped = this.groupedSlots();
    return grouped.morning.length > 0 || 
           grouped.afternoon.length > 0 || 
           grouped.evening.length > 0;
  });

  onClose(): void {
    this.close.emit();
  }

  onSelectTimeSlot(slot: CalendarTimeSlot): void {
    if (slot.isAvailable) {
      this.selectTimeSlot.emit({
        time: slot.startTime,
        professionalId: slot.professionalId,
        professionalName: slot.professionalName
      });
    }
  }
}