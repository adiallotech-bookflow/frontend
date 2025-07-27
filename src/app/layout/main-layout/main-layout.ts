import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NotificationComponent } from '../../shared/components/notification/notification';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NotificationComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  isSidebarOpen = signal(false);
  isUserMenuOpen = signal(false);

  currentUser$ = this.authService.currentUser$;
  userInitials = computed(() => this.authService.getUserInitials());

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '' },
    { label: 'Booking', route: '/booking', icon: '' },
    { label: 'My Appointments', route: '/appointments', icon: '' }
  ];

  toggleSidebar(): void {
    this.isSidebarOpen.update(value => !value);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(value => !value);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
