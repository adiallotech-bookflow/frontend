import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Service, BookingProfessional } from '../../../../core/models';

@Component({
  selector: 'app-professional-step',
  imports: [CommonModule],
  templateUrl: './professional-step.html',
  styleUrl: './professional-step.css'
})
export class ProfessionalStep {
  selectedService = input.required<Service>();
  selectedProfessional = input<BookingProfessional | null>(null);
  professionalSelected = output<BookingProfessional>();

  professionals: BookingProfessional[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      title: 'Senior Hair Stylist',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=6366f1&color=fff',
      rating: 4.9,
      reviewCount: 124,
      specialties: ['Hair Color', 'Haircut', 'Hair Styling']
    },
    {
      id: '2',
      name: 'Michael Chen',
      title: 'Master Colorist',
      avatar: 'https://ui-avatars.com/api/?name=Michael+Chen&background=6366f1&color=fff',
      rating: 4.8,
      reviewCount: 98,
      specialties: ['Hair Color', 'Highlights', 'Color Correction']
    },
    {
      id: '3',
      name: 'Emma Wilson',
      title: 'Wellness Specialist',
      avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=6366f1&color=fff',
      rating: 5.0,
      reviewCount: 156,
      specialties: ['Massage Therapy', 'Facial Treatment', 'Aromatherapy']
    },
    {
      id: '4',
      name: 'James Martinez',
      title: 'Nail Artist',
      avatar: 'https://ui-avatars.com/api/?name=James+Martinez&background=6366f1&color=fff',
      rating: 4.7,
      reviewCount: 87,
      specialties: ['Manicure', 'Pedicure', 'Nail Art']
    }
  ];

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