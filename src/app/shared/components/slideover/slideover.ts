import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slideover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slideover.html',
  styleUrl: './slideover.css'
})
export class SlideoverComponent {
  isOpen = input.required<boolean>();
  title = input.required<string>();
  close = output<void>();

  onClose(): void {
    this.close.emit();
  }
}