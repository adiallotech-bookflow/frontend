import { Component, input, output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Service } from '../../../../core/models';
import { AppointmentsMockService } from '../../../../core/services/mock';

@Component({
  selector: 'app-service-step',
  imports: [CommonModule],
  templateUrl: './service-step.html',
  styleUrl: './service-step.css'
})
export class ServiceStep implements OnInit {
  private appointmentsService = inject(AppointmentsMockService);
  
  selectedService = input<Service | null>(null);
  serviceSelected = output<Service>();

  services = signal<Service[]>([]);
  categories = signal<{ id: string; name: string; icon: string }[]>([]);
  selectedCategory = signal('all');

  ngOnInit() {
    // Load services from mock service
    this.appointmentsService.getAvailableServices().subscribe(services => {
      this.services.set(services);
    });

    // Load categories from mock service
    this.appointmentsService.getServiceCategories().subscribe(categories => {
      this.categories.set(categories);
    });
  }

  get filteredServices(): Service[] {
    if (this.selectedCategory() === 'all') {
      return this.services();
    }
    return this.services().filter(s => s.categoryId === this.selectedCategory());
  }

  selectService(service: Service): void {
    this.serviceSelected.emit(service);
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
  }

  isSelected(service: Service): boolean {
    return this.selectedService()?.id === service.id;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
}