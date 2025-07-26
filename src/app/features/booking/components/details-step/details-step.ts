import { Component, input, output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BookingDetails } from '../../../../core/models';

@Component({
  selector: 'app-details-step',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './details-step.html',
  styleUrl: './details-step.css'
})
export class DetailsStep implements OnInit, OnDestroy {
  formGroup = input.required<FormGroup>();
  detailsUpdated = output<BookingDetails>();

  private subscription?: Subscription;

  ngOnInit(): void {
    // Emit form values when they change and are valid
    this.subscription = this.formGroup().valueChanges.subscribe(values => {
      if (this.formGroup().valid) {
        this.detailsUpdated.emit(values);
      }
    });

    // Emit initial values if form is already valid
    if (this.formGroup().valid) {
      this.detailsUpdated.emit(this.formGroup().value);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get firstName() {
    return this.formGroup().get('firstName');
  }

  get lastName() {
    return this.formGroup().get('lastName');
  }

  get email() {
    return this.formGroup().get('email');
  }

  get phone() {
    return this.formGroup().get('phone');
  }

  get notes() {
    return this.formGroup().get('notes');
  }

  getErrorMessage(controlName: string): string {
    const control = this.formGroup().get(controlName);
    if (!control?.errors || !control.touched) return '';

    if (control.errors['required']) {
      return `${this.getFieldLabel(controlName)} is required`;
    }
    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (control.errors['minlength']) {
      return `${this.getFieldLabel(controlName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['pattern']) {
      return 'Please enter a valid phone number';
    }

    return '';
  }

  private getFieldLabel(controlName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone number'
    };
    return labels[controlName] || controlName;
  }
}