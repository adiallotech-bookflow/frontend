import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MockBaseService } from './mock-base.service';
import { MockDataGenerator } from './mock-data.generator';
import { Customer, AppointmentFormData, AppointmentExtended, ProfessionalExtended, TimeSlotAvailability, Service } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class AppointmentsMockService extends MockBaseService<AppointmentExtended> {
  protected override storageKey = 'bookflow_mock_appointments';
  private professionalsStorageKey = 'bookflow_mock_professionals';
  private customersStorageKey = 'bookflow_mock_customers';

  private professionals: ProfessionalExtended[] = [];
  private customers: Customer[] = [];

  constructor() {
    super();
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const storedAppointments = this.getStoredData();

    // Always regenerate data to ensure it matches current users
    const { appointments, professionals, customers } = MockDataGenerator.generateMultipleAppointments(20);

    // Check if we need to update stored data
    const needsUpdate = !storedAppointments ||
                       storedAppointments.length === 0 ||
                       !this.dataMatchesCurrentUsers(storedAppointments, customers);

    if (needsUpdate) {
      this.defaultData = appointments;
      this.professionals = professionals;
      this.customers = customers;

      this.saveToStorage(appointments);
      this.saveProfessionals(professionals);
      this.saveCustomers(customers);
    } else {
      this.professionals = this.loadProfessionals();
      this.customers = this.loadCustomers();
    }
  }

  private dataMatchesCurrentUsers(appointments: AppointmentExtended[], customers: Customer[]): boolean {
    // Check if the customer IDs in appointments match our current customer IDs
    const customerIds = new Set(customers.map(c => c.id));
    const appointmentCustomerIds = new Set(appointments.map(a => a.customerId));

    // Check if we have appointments for our test users
    return customerIds.has('customer-user-id') &&
           appointmentCustomerIds.has('customer-user-id');
  }

  private saveProfessionals(professionals: ProfessionalExtended[]): void {
    try {
      localStorage.setItem(this.professionalsStorageKey, JSON.stringify(professionals));
    } catch (error) {
      console.warn('Failed to save professionals to localStorage:', error);
    }
  }

  private loadProfessionals(): ProfessionalExtended[] {
    try {
      const stored = localStorage.getItem(this.professionalsStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load professionals from localStorage:', error);
      return [];
    }
  }

  private saveCustomers(customers: Customer[]): void {
    try {
      localStorage.setItem(this.customersStorageKey, JSON.stringify(customers));
    } catch (error) {
      console.warn('Failed to save customers to localStorage:', error);
    }
  }

  private loadCustomers(): Customer[] {
    try {
      const stored = localStorage.getItem(this.customersStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load customers from localStorage:', error);
      return [];
    }
  }

  getAppointments(): Observable<AppointmentExtended[]> {
    return this.getAllFromMockData() as Observable<AppointmentExtended[]>;
  }

  getAppointmentById(id: string): Observable<AppointmentExtended> {
    return this.getByIdFromMockData(id);
  }

  getAppointmentsByProfessional(professionalId: string): Observable<AppointmentExtended[]> {
    return this.simulateDelay().pipe(
      map(() => {
        const appointments = this.getStoredData() || [];
        return appointments.filter(apt => apt.professionalId === professionalId);
      })
    );
  }

  getAppointmentsByCustomer(customerId: string): Observable<AppointmentExtended[]> {
    return this.simulateDelay().pipe(
      map(() => {
        const appointments = this.getStoredData() || [];
        return appointments.filter(apt => apt.customerId === customerId);
      })
    );
  }

  getAppointmentsByDateRange(startDate: Date, endDate: Date): Observable<AppointmentExtended[]> {
    return this.simulateDelay().pipe(
      map(() => {
        const appointments = this.getStoredData() || [];
        return appointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= startDate && aptDate <= endDate;
        });
      })
    );
  }

  createAppointment(data: AppointmentFormData): Observable<AppointmentExtended> {
    const professional = this.professionals.find(p => p.id === data.professionalId);
    const customer = this.customers.find(c => c.id === data.customerId);

    if (!professional || !customer) {
      return this.simulateError({ message: 'Professional or customer not found', status: 404 });
    }

    const appointment: AppointmentExtended = {
      id: MockDataGenerator.generateId(),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      professionalId: professional.id,
      professionalName: professional.name,
      serviceType: data.service,
      service: data.service,
      date: data.date,
      time: data.time,
      startTime: new Date(data.date + 'T' + data.time),
      duration: data.duration || 30,
      price: data.price || 50,
      status: 'scheduled',
      notes: data.notes
    };
    console.log('Creating appointment:', appointment);

    return this.addToMockData(appointment);
  }

  updateAppointment(id: string, updates: Partial<AppointmentExtended>): Observable<AppointmentExtended> {
    return this.updateInMockData(id, updates);
  }

  cancelAppointment(id: string): Observable<AppointmentExtended> {
    return this.updateInMockData(id, { status: 'cancelled' });
  }

  confirmAppointment(id: string): Observable<AppointmentExtended> {
    return this.updateInMockData(id, { status: 'confirmed' });
  }

  completeAppointment(id: string): Observable<AppointmentExtended> {
    return this.updateInMockData(id, { status: 'completed' });
  }

  deleteAppointment(id: string): Observable<boolean> {
    return this.deleteFromMockData(id);
  }

  searchAppointments(searchTerm: string): Observable<AppointmentExtended[]> {
    return this.searchInMockData(
      searchTerm,
      ['customerName', 'professionalName', 'service', 'notes']
    ) as Observable<AppointmentExtended[]>;
  }

  getAvailableTimeSlots(professionalId: string, date: Date): Observable<TimeSlotAvailability[]> {
    return this.simulateDelay().pipe(
      switchMap(() => this.getAppointmentsByProfessional(professionalId)),
      map(appointments => {
        const dateStr = date.toISOString().split('T')[0];
        const bookedSlots = appointments
          .filter(apt => apt.date.startsWith(dateStr))
          .map(apt => apt.time);

        const slots: TimeSlotAvailability[] = [];
        for (let hour = 9; hour < 18; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const isBooked = bookedSlots.includes(time);

            const slot = MockDataGenerator.generateTimeSlot(date, hour, minute);
            slot.available = !isBooked;
            slots.push(slot);
          }
        }

        return slots;
      })
    );
  }

  getProfessionals(): Observable<ProfessionalExtended[]> {
    return this.simulateDelay().pipe(
      map(() => this.professionals)
    );
  }

  getProfessionalById(id: string): Observable<ProfessionalExtended | undefined> {
    return this.simulateDelay().pipe(
      map(() => this.professionals.find(p => p.id === id))
    );
  }

  getCustomers(): Observable<Customer[]> {
    return this.simulateDelay().pipe(
      map(() => this.customers)
    );
  }

  getCustomerById(id: string): Observable<Customer | undefined> {
    return this.simulateDelay().pipe(
      map(() => this.customers.find(c => c.id === id))
    );
  }

  getUpcomingAppointments(limit: number = 5, userId?: string, userRole?: 'admin' | 'professional' | 'customer'): Observable<AppointmentExtended[]> {
    return this.simulateDelay().pipe(
      map(() => {
        const now = new Date();
        let appointments = this.getStoredData() || [];

        // Filter appointments based on user role
        if (userId && userRole) {
          if (userRole === 'customer') {
            appointments = appointments.filter(apt => apt.customerId === userId);
          } else if (userRole === 'professional') {
            appointments = appointments.filter(apt => apt.professionalId === userId);
          }
          // Admin sees all appointments (no filter)
        }

        return appointments
          .filter(apt => new Date(apt.date) > now && apt.status !== 'cancelled')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, limit);
      })
    );
  }

  getRecentAppointments(limit: number = 5, userId?: string, userRole?: 'admin' | 'professional' | 'customer'): Observable<AppointmentExtended[]> {
    return this.simulateDelay().pipe(
      map(() => {
        let appointments = this.getStoredData() || [];

        // Filter appointments based on user role
        if (userId && userRole) {
          if (userRole === 'customer') {
            appointments = appointments.filter(apt => apt.customerId === userId);
          } else if (userRole === 'professional') {
            appointments = appointments.filter(apt => apt.professionalId === userId);
          }
          // Admin sees all appointments (no filter)
        }

        return appointments
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
      })
    );
  }

  regenerateAllData(): void {
    // Clear all stored data
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.professionalsStorageKey);
    localStorage.removeItem(this.customersStorageKey);

    // Regenerate fresh data
    this.initializeMockData();
  }

  getDashboardStats(userId?: string, userRole?: 'admin' | 'professional' | 'customer'): Observable<{
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalRevenue: number;
  }> {
    return this.simulateDelay().pipe(
      map(() => {
        let appointments = this.getStoredData() || [];
        const now = new Date();

        // Filter appointments based on user role
        if (userId && userRole) {
          if (userRole === 'customer') {
            appointments = appointments.filter(apt => apt.customerId === userId);
          } else if (userRole === 'professional') {
            appointments = appointments.filter(apt => apt.professionalId === userId);
          }
          // Admin sees all appointments (no filter)
        }

        return {
          totalAppointments: appointments.length,
          upcomingAppointments: appointments.filter(apt =>
            new Date(apt.date) > now && apt.status !== 'cancelled'
          ).length,
          completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
          cancelledAppointments: appointments.filter(apt => apt.status === 'cancelled').length,
          totalRevenue: appointments
            .filter(apt => apt.status === 'completed')
            .reduce((sum, apt) => sum + apt.price, 0)
        };
      })
    );
  }

  getAvailableServices(): Observable<Service[]> {
    return this.simulateDelay().pipe(
      map(() => {
        // Extract unique services from professionals
        const servicesMap = new Map<string, Service>();
        let serviceId = 1;

        this.professionals.forEach(professional => {
          professional.specialties.forEach(specialty => {
            if (!servicesMap.has(specialty)) {
              const basePrice = this.getServiceBasePrice(specialty);
              const baseDuration = this.getServiceBaseDuration(specialty);

              servicesMap.set(specialty, {
                id: `service-${serviceId++}`,
                name: specialty,
                description: this.getServiceDescription(specialty),
                duration: baseDuration,
                price: basePrice,
                categoryId: this.getServiceCategory(specialty)
              });
            }
          });
        });

        return Array.from(servicesMap.values());
      })
    );
  }

  getServiceCategories(): Observable<{ id: string; name: string; icon: string }[]> {
    return this.simulateDelay().pipe(
      map(() => [
        { id: 'all', name: 'All Services', icon: 'grid' },
        { id: 'hair', name: 'Hair', icon: 'scissors' },
        { id: 'beauty', name: 'Beauty', icon: 'sparkles' },
        { id: 'treatment', name: 'Treatment', icon: 'heart' },
        { id: 'style', name: 'Style', icon: 'brush' }
      ])
    );
  }

  private getServiceDescription(serviceName: string): string {
    const descriptions: { [key: string]: string } = {
      'Men\'s Haircut': 'Professional men\'s haircut tailored to your style',
      'Women\'s Haircut': 'Expert women\'s haircut with styling consultation',
      'Hair Coloring': 'Full hair coloring service with premium products',
      'Highlights': 'Professional highlights for a natural, sun-kissed look',
      'Blowout': 'Professional blowout for smooth, voluminous hair',
      'Beard Trim': 'Expert beard shaping and grooming',
      'Hair Treatment': 'Deep conditioning treatment for healthy hair',
      'Wedding Hair': 'Special occasion hair styling for your big day',
      'Perm': 'Professional permanent wave for lasting curls',
      'Hair Straightening': 'Professional straightening treatment'
    };
    return descriptions[serviceName] || `Professional ${serviceName.toLowerCase()} service`;
  }

  private getServiceBasePrice(serviceName: string): number {
    const prices: { [key: string]: number } = {
      'Men\'s Haircut': 35,
      'Women\'s Haircut': 45,
      'Hair Coloring': 85,
      'Highlights': 120,
      'Blowout': 50,
      'Beard Trim': 25,
      'Hair Treatment': 65,
      'Wedding Hair': 150,
      'Perm': 95,
      'Hair Straightening': 110
    };
    return prices[serviceName] || 50;
  }

  private getServiceBaseDuration(serviceName: string): number {
    const durations: { [key: string]: number } = {
      'Men\'s Haircut': 30,
      'Women\'s Haircut': 45,
      'Hair Coloring': 120,
      'Highlights': 150,
      'Blowout': 45,
      'Beard Trim': 20,
      'Hair Treatment': 60,
      'Wedding Hair': 120,
      'Perm': 180,
      'Hair Straightening': 120
    };
    return durations[serviceName] || 60;
  }

  private getServiceCategory(serviceName: string): string {
    const categories: { [key: string]: string } = {
      'Men\'s Haircut': 'hair',
      'Women\'s Haircut': 'hair',
      'Hair Coloring': 'hair',
      'Highlights': 'hair',
      'Blowout': 'style',
      'Beard Trim': 'hair',
      'Hair Treatment': 'treatment',
      'Wedding Hair': 'style',
      'Perm': 'treatment',
      'Hair Straightening': 'treatment'
    };
    return categories[serviceName] || 'beauty';
  }
}
