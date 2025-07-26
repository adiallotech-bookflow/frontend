import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Service } from '../../../../core/models';

@Component({
  selector: 'app-service-step',
  imports: [CommonModule],
  templateUrl: './service-step.html',
  styleUrl: './service-step.css'
})
export class ServiceStep {
  selectedService = input<Service | null>(null);
  serviceSelected = output<Service>();

  services: Service[] = [
    {
      id: '1',
      name: 'Haircut',
      description: 'Professional haircut tailored to your style',
      duration: 30,
      price: 35,
      categoryId: 'hair'
    },
    {
      id: '2',
      name: 'Hair Color',
      description: 'Full hair coloring service with premium products',
      duration: 120,
      price: 85,
      categoryId: 'hair'
    },
    {
      id: '3',
      name: 'Facial Treatment',
      description: 'Rejuvenating facial with deep cleansing',
      duration: 60,
      price: 65,
      categoryId: 'skin'
    },
    {
      id: '4',
      name: 'Massage Therapy',
      description: 'Relaxing full body massage',
      duration: 60,
      price: 80,
      categoryId: 'wellness'
    },
    {
      id: '5',
      name: 'Manicure',
      description: 'Professional nail care and polish',
      duration: 45,
      price: 40,
      categoryId: 'nails'
    },
    {
      id: '6',
      name: 'Pedicure',
      description: 'Complete foot and nail care treatment',
      duration: 50,
      price: 45,
      categoryId: 'nails'
    }
  ];

  categories = [
    { id: 'all', name: 'All Services', icon: 'grid' },
    { id: 'hair', name: 'Hair', icon: 'scissors' },
    { id: 'skin', name: 'Skin Care', icon: 'sparkles' },
    { id: 'wellness', name: 'Wellness', icon: 'heart' },
    { id: 'nails', name: 'Nails', icon: 'hand' }
  ];

  selectedCategory = 'all';

  get filteredServices(): Service[] {
    if (this.selectedCategory === 'all') {
      return this.services;
    }
    return this.services.filter(s => s.categoryId === this.selectedCategory);
  }

  selectService(service: Service): void {
    this.serviceSelected.emit(service);
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