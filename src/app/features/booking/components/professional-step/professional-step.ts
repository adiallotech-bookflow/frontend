import { Component, input, output, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Service, BookingProfessional } from '../../../../core/models';
import { AppointmentsMockService } from '../../../../core/services/mock';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-professional-step',
  imports: [CommonModule],
  templateUrl: './professional-step.html',
  styleUrl: './professional-step.css'
})
export class ProfessionalStep implements OnInit {
  private appointmentsService = inject(AppointmentsMockService);
  
  selectedService = input.required<Service>();
  selectedProfessional = input<BookingProfessional | null>(null);
  professionalSelected = output<BookingProfessional>();

  allProfessionals = signal<BookingProfessional[]>([]);
  
  // Filter professionals based on selected service
  professionals = computed(() => {
    const service = this.selectedService();
    const allProfs = this.allProfessionals();
    
    if (!service) return allProfs;
    
    // Filter professionals who have the selected service in their specialties
    return allProfs.filter(prof => 
      prof.specialties.includes(service.name)
    );
  });

  ngOnInit() {
    // Load professionals from mock service
    this.appointmentsService.getProfessionals().pipe(
      map(professionals => 
        professionals.map(prof => ({
          id: prof.id,
          name: prof.name,
          title: prof.specialty, // Use specialty as title
          avatar: prof.avatar || `https://ui-avatars.com/api/?name=${prof.name.replace(' ', '+')}&background=6366f1&color=fff`,
          rating: prof.rating,
          reviewCount: Math.floor(Math.random() * 150) + 50, // Generate random review count
          specialties: prof.specialties
        }))
      )
    ).subscribe(professionals => {
      this.allProfessionals.set(professionals);
    });
  }

  selectProfessional(professional: BookingProfessional): void {
    this.professionalSelected.emit(professional);
  }

  isSelected(professional: BookingProfessional): boolean {
    return this.selectedProfessional()?.id === professional.id;
  }

  getStarArray(rating: number): boolean[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars: boolean[] = [];
    
    for (let i = 0; i < 5; i++) {
      stars.push(i < fullStars || (i === fullStars && hasHalfStar));
    }
    
    return stars;
  }
}