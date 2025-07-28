import { Component, input, output, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Service } from '../../../../core/models';
import { AppointmentsMockService } from '../../../../core/services/mock';
import { forkJoin } from 'rxjs';

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
  isLoading = signal(true);

  ngOnInit() {
    this.isLoading.set(true);
    
    // Load services and categories in parallel
    forkJoin({
      services: this.appointmentsService.getAvailableServices(),
      categories: this.appointmentsService.getServiceCategories()
    }).subscribe({
      next: ({ services, categories }) => {
        this.services.set(services);
        this.categories.set(categories);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.isLoading.set(false);
      }
    });
  }

  filteredServices = computed(() => {
    if (this.selectedCategory() === 'all') {
      return this.services();
    }
    return this.services().filter(s => s.categoryId === this.selectedCategory());
  });

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