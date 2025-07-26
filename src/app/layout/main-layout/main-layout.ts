import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout {
  isSidebarOpen = signal(false);
  isUserMenuOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '' },
    { label: 'Calendar', route: '/calendar', icon: '' },
    { label: 'My Appointments', route: '/appointments', icon: '' }
  ];

  currentUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
  };

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
}
