import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceStep } from './components/service-step/service-step';
import { ProfessionalStep } from './components/professional-step/professional-step';
import { DatetimeStep } from './components/datetime-step/datetime-step';
import { DetailsStep } from './components/details-step/details-step';
import { BookingSummary } from './components/booking-summary/booking-summary';
import { BookingFormData, BookingStep, StepName } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppointmentsMockService } from '../../core/services/mock';

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
export class Booking implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private appointmentsService = inject(AppointmentsMockService);
  private router = inject(Router);

  bookingForm: FormGroup;
  currentStep = signal<StepName>('service');
  isLoading = signal(true);

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
    details: null
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
    // Initialize form with empty values first
    this.bookingForm = this.fb.group({
      service: [null, Validators.required],
      professional: [null, Validators.required],
      datetime: this.fb.group({
        date: [null, Validators.required],
        time: [null, Validators.required]
      }),
      details: this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
        notes: ['']
      })
    });
  }

  ngOnInit(): void {
    // Simulate initial loading
    this.isLoading.set(true);
    
    // Pre-fill form with current user data if available
    setTimeout(() => {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        const detailsForm = this.bookingForm.get('details');
        detailsForm?.patchValue({
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          phone: '' // User might not have phone in the model, leave empty for user to fill
        });

        // Also update the signal for immediate display
        this.formData.update(data => ({
          ...data,
          details: {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
            phone: '',
            notes: ''
          }
        }));
      }
      this.isLoading.set(false);
    }, 500); // Small delay to show loading state
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
      const formData = this.formData();
      const currentUser = this.authService.getCurrentUser();

      if (!currentUser) {
        this.notificationService.show({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please log in to complete your booking.'
        });
        this.router.navigate(['/auth/login']);
        return;
      }

      // Show confirmation notification
      this.notificationService.showConfirmation(
        'Confirm Booking',
        `Are you sure you want to book ${formData.service!.name} with ${formData.professional!.name} on ${formData.date!.toLocaleDateString()} at ${formData.time}? Total: $${formData.service!.price}`,
        () => {
          // On confirm - proceed with booking
          this.proceedWithBooking();
        },
        () => {
          // On cancel - do nothing, notification will be auto-dismissed
        }
      );
    }
  }

  private proceedWithBooking(): void {
    const formData = this.formData();
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) return;

    // Create appointment data
    const appointmentData = {
      customerId: currentUser.id,
      professionalId: formData.professional!.id,
      service: formData.service!.name,
      date: formData.date!.toISOString().split('T')[0],
      time: formData.time!,
      duration: formData.service!.duration,
      price: formData.service!.price,
      notes: formData.details?.notes
    };
    console.log('Appointment data:', appointmentData);
    // Create the appointment
    this.appointmentsService.createAppointment(appointmentData).subscribe({
      next: (appointment) => {
        console.log('Appointment created:', appointment);
        this.notificationService.show({
          type: 'success',
          title: 'Booking Confirmed!',
          message: `Your ${formData.service!.name} appointment with ${formData.professional!.name} has been confirmed for ${formData.date!.toLocaleDateString()} at ${formData.time}.`,
          duration: 7000
        });

        // Navigate to dashboard after a short delay
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          title: 'Booking Failed',
          message: 'There was an error creating your appointment. Please try again.',
          duration: 5000
        });
        console.error('Booking error:', error);
      }
    });
  }
}
