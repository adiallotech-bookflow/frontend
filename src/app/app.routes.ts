import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
        title: 'My Dashboard - BookFlow'
      },
      {
        path: 'calendar',
        loadComponent: () => import('./features/calendar/calendar').then(m => m.Calendar),
        title: 'Calendar - BookFlow'
      },
      {
        path: 'booking',
        loadComponent: () => import('./features/booking/booking').then(m => m.Booking),
        title: 'Book Appointment - BookFlow'
      },
      {
        path: 'appointments',
        loadComponent: () => import('./features/appointments/appointments').then(m => m.Appointments),
        title: 'My Appointments - BookFlow'
      }
    ]
  }
];
