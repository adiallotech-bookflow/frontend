import { Appointment, Customer, AppointmentExtended, ProfessionalExtended, TimeSlotAvailability } from '../../models';
import { MOCK_USERS } from './mock-users.data';

export class MockDataGenerator {
  private static firstNames = [
    'John', 'Emma', 'Michael', 'Sophia', 'William', 'Olivia', 'James', 'Ava',
    'Robert', 'Isabella', 'David', 'Mia', 'Joseph', 'Charlotte', 'Thomas', 'Amelia'
  ];

  private static lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'
  ];

  private static services = [
    'Men\'s Haircut', 'Women\'s Haircut', 'Hair Coloring', 'Highlights', 'Blowout',
    'Beard Trim', 'Hair Treatment', 'Wedding Hair', 'Perm', 'Hair Straightening'
  ];

  private static businessNames = [
    'Elite Salon', 'Modern Hair Studio', 'Style & Beauty', 'The Hair Gallery',
    'Prestige Salon', 'Express Cuts', 'Studio Hair', 'Trendy Salon'
  ];

  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  static generatePhoneNumber(): string {
    const areaCode = ['212', '646', '917', '718', '347'][Math.floor(Math.random() * 5)];
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }


  static generateTimeSlot(date: Date, hour: number, minute: number = 0): TimeSlotAvailability {
    const start = new Date(date);
    start.setHours(hour, minute, 0, 0);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
      available: Math.random() > 0.3
    };
  }

  static generateProfessional(): ProfessionalExtended {
    const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
    const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
    const specialties = this.services.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2);

    return {
      id: this.generateId(),
      name: `${firstName} ${lastName}`,
      specialty: specialties[0],
      specialties,
      avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      businessName: this.businessNames[Math.floor(Math.random() * this.businessNames.length)]
    };
  }

  static getUsersAsCustomers(): Customer[] {
    // Convert users with customer role to Customer objects
    return MOCK_USERS
      .filter(user => user.role === 'customer')
      .map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: this.generatePhoneNumber()
      }));
  }

  static getUsersAsProfessionals(): ProfessionalExtended[] {
    // Convert users with professional role to ProfessionalExtended objects
    return MOCK_USERS
      .filter(user => user.role === 'professional')
      .map(user => {
        const specialties = this.services.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2);
        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          specialty: specialties[0],
          specialties,
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`,
          rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
          businessName: this.businessNames[Math.floor(Math.random() * this.businessNames.length)]
        };
      });
  }

  static generateAppointment(professionals: ProfessionalExtended[], customers: Customer[]): AppointmentExtended {
    const professional = professionals[Math.floor(Math.random() * professionals.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const service = professional.specialties[Math.floor(Math.random() * professional.specialties.length)];

    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 30) - 15);
    date.setHours(9 + Math.floor(Math.random() * 10), Math.random() > 0.5 ? 0 : 30, 0, 0);

    const statuses: Appointment['status'][] = ['confirmed', 'scheduled', 'cancelled', 'completed'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      id: this.generateId(),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      professionalId: professional.id,
      professionalName: professional.name,
      serviceType: service,
      service,
      date: date.toISOString(),
      time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
      startTime: date,
      duration: 30 + Math.floor(Math.random() * 4) * 15,
      price: 20 + Math.floor(Math.random() * 8) * 10,
      status,
      notes: Math.random() > 0.7 ? 'Regular client, prefers short cuts' : undefined
    };
  }

  static generateMultipleAppointments(count: number = 20): {
    appointments: AppointmentExtended[],
    professionals: ProfessionalExtended[],
    customers: Customer[]
  } {
    // Use existing users as professionals and customers
    const professionals = this.getUsersAsProfessionals();
    const customers = this.getUsersAsCustomers();
    
    // If we need more professionals, generate additional ones
    const additionalProfessionalsNeeded = Math.max(0, 5 - professionals.length);
    for (let i = 0; i < additionalProfessionalsNeeded; i++) {
      professionals.push(this.generateProfessional());
    }
    
    const appointments = Array(count).fill(null).map(() => this.generateAppointment(professionals, customers));

    return { appointments, professionals, customers };
  }
}
