import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceStep } from './components/service-step/service-step';
import { ProfessionalStep } from './components/professional-step/professional-step';
import { DatetimeStep } from './components/datetime-step/datetime-step';
import { DetailsStep } from './components/details-step/details-step';
import { BookingSummary } from './components/booking-summary/booking-summary';
import { BookingFormData, BookingStep, StepName } from '../../core/models';

@Component({
  selector: 'app-booking',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ServiceStep,
    ProfessionalStep,
    DatetimeStep,
    DetailsStep,
    BookingSummary
  ],
  templateUrl: './booking.html',
  styleUrl: './booking.css'
})
export class Booking {
  private fb = new FormBuilder();

  bookingForm: FormGroup;
  currentStep = signal<StepName>('service');

  steps = signal<BookingStep[]>([
    { id: 1, name: 'service', label: 'Service', completed: false, active: true },
    { id: 2, name: 'professional', label: 'Professional', completed: false, active: false },
    { id: 3, name: 'datetime', label: 'Date & Time', completed: false, active: false },
    { id: 4, name: 'details', label: 'Details', completed: false, active: false },
    { id: 5, name: 'summary', label: 'Summary', completed: false, active: false }
  ]);

  formData = signal<BookingFormData>({
    service: null,
    professional: null,
    date: null,
    time: null,
    details: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      notes: ''
    }
  });

  currentStepIndex = computed(() => {
    const stepName = this.currentStep();
    return this.steps().findIndex(s => s.name === stepName);
  });

  canGoNext = computed(() => {
    const stepName = this.currentStep();
    const data = this.formData();

    switch (stepName) {
      case 'service':
        return data.service !== null;
      case 'professional':
        return data.professional !== null;
      case 'datetime':
        return data.date !== null && data.time !== null;
      case 'details':
        return data.details !== null && this.bookingForm.get('details')?.valid === true;
      case 'summary':
        return false;
      default:
        return false;
    }
  });

  canGoBack = computed(() => {
    return this.currentStepIndex() > 0;
  });

  constructor() {
    this.bookingForm = this.fb.group({
      service: [null, Validators.required],
      professional: [null, Validators.required],
      datetime: this.fb.group({
        date: [null, Validators.required],
        time: [null, Validators.required]
      }),
      details: this.fb.group({
        firstName: ['John', [Validators.required, Validators.minLength(2)]],
        lastName: ['Doe', [Validators.required, Validators.minLength(2)]],
        email: ['john.doe@example.com', [Validators.required, Validators.email]],
        phone: ['+1 (555) 123-4567', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
        notes: ['']
      })
    });
  }

  goToStep(stepName: StepName): void {
    const targetIndex = this.steps().findIndex(s => s.name === stepName);
    const currentIndex = this.currentStepIndex();

    if (targetIndex < currentIndex || this.steps()[targetIndex].completed) {
      this.updateSteps(stepName);
      this.currentStep.set(stepName);
    }
  }

  nextStep(): void {
    const currentIndex = this.currentStepIndex();
    if (currentIndex < this.steps().length - 1 && this.canGoNext()) {
      const steps = [...this.steps()];
      steps[currentIndex].completed = true;
      steps[currentIndex].active = false;
      steps[currentIndex + 1].active = true;
      this.steps.set(steps);

      const nextStepName = steps[currentIndex + 1].name as StepName;
      this.currentStep.set(nextStepName);
    }
  }

  previousStep(): void {
    const currentIndex = this.currentStepIndex();
    if (currentIndex > 0) {
      const steps = [...this.steps()];
      steps[currentIndex].active = false;
      steps[currentIndex - 1].active = true;
      this.steps.set(steps);

      const prevStepName = steps[currentIndex - 1].name as StepName;
      this.currentStep.set(prevStepName);
    }
  }

  updateSteps(targetStepName: StepName): void {
    const targetIndex = this.steps().findIndex(s => s.name === targetStepName);
    const steps = [...this.steps()];

    steps.forEach((step, index) => {
      step.active = index === targetIndex;
    });

    this.steps.set(steps);
  }

  updateFormData(stepName: StepName, data: any): void {
    const currentData = this.formData();

    switch (stepName) {
      case 'service':
        this.formData.set({ ...currentData, service: data });
        this.bookingForm.patchValue({ service: data });
        break;
      case 'professional':
        this.formData.set({ ...currentData, professional: data });
        this.bookingForm.patchValue({ professional: data });
        break;
      case 'datetime':
        this.formData.set({ ...currentData, date: data.date, time: data.time });
        this.bookingForm.patchValue({ datetime: { date: data.date, time: data.time } });
        break;
      case 'details':
        this.formData.set({ ...currentData, details: data });
        this.bookingForm.patchValue({ details: data });
        break;
    }
  }

  confirmBooking(): void {
    if (this.bookingForm.valid) {
      console.log('Booking confirmed:', this.formData());
      // Here you would typically send the booking to a service
    }
  }
}
