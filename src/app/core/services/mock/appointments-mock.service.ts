import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MockBaseService } from './mock-base.service';
import { MockDataGenerator } from './mock-data.generator';
import { Customer, AppointmentFormData, AppointmentExtended, ProfessionalExtended, TimeSlotAvailability } from '../../models';

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

  getUpcomingAppointments(limit: number = 5): Observable<AppointmentExtended[]> {
    return this.simulateDelay().pipe(
      map(() => {
        const now = new Date();
        const appointments = this.getStoredData() || [];

        return appointments
          .filter(apt => new Date(apt.date) > now && apt.status !== 'cancelled')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, limit);
      })
    );
  }

  getRecentAppointments(limit: number = 5): Observable<AppointmentExtended[]> {
    return this.simulateDelay().pipe(
      map(() => {
        const appointments = this.getStoredData() || [];

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

  getDashboardStats(): Observable<{
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalRevenue: number;
  }> {
    return this.simulateDelay().pipe(
      map(() => {
        const appointments = this.getStoredData() || [];
        const now = new Date();

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
}
