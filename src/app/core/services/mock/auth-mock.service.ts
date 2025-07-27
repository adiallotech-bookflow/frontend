import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MockBaseService } from './mock-base.service';
import { MOCK_USERS } from './mock-users.data';
import { User, RegisterRequest, AuthResponse, AuthSession } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class AuthMockService extends MockBaseService<User> {
  private readonly SESSION_KEY = 'bookflow_auth_session';
  private readonly TOKEN_EXPIRY_HOURS = 24;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  public isAuthenticated$ = this.currentUser$.pipe(map((user) => !!user));

  protected override storageKey = 'bookflow_users';

  protected override defaultData: User[] = MOCK_USERS;

  constructor() {
    super();

    const existingUsers = this.getStoredData();
    if (!existingUsers || existingUsers.length === 0) {
      this.saveToStorage(this.defaultData);
    }

    this.initializeAuth();
  }

  private initializeAuth(): void {
    const session = this.getStoredSession();
    if (session && this.isSessionValid(session)) {
      this.currentUserSubject.next(session.user);
    } else if (session) {
      this.clearSession();
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    if (this.configService.shouldSimulateError()) {
      const error = {
        message: 'Network error during login',
        code: 'NETWORK_ERROR',
        status: 503,
        timestamp: new Date().toISOString(),
      };
      return throwError(() => error);
    }

    return this.simulateDelay().pipe(
      switchMap(() => {
        const users = this.getStoredData() || [];

        const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
          return throwError(() => ({
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS',
            status: 401,
          }));
        }

        if (password !== 'password123') {
          return throwError(() => ({
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS',
            status: 401,
          }));
        }

        const authResponse = this.generateAuthResponse(user);

        this.storeSession({
          user,
          token: authResponse.token,
          expiresAt: authResponse.expiresAt,
          refreshToken: this.generateRefreshToken(),
        });

        this.currentUserSubject.next(user);

        return of(authResponse);
      })
    );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    if (Math.random() < 0.03) {
      const error = {
        message: 'Network error during registration',
        code: 'NETWORK_ERROR',
        status: 503,
        timestamp: new Date().toISOString(),
      };
      return throwError(() => error);
    }

    return this.simulateDelay().pipe(
      switchMap(() => {
        const users = this.getStoredData() || [];

        const existingUser = users.find((u) => u.email.toLowerCase() === registerData.email.toLowerCase());

        if (existingUser) {
          return throwError(() => ({
            message: 'This email is already in use',
            code: 'EMAIL_ALREADY_EXISTS',
            status: 409,
          }));
        }

        const newUser: User = {
          id: this.generateId(),
          email: registerData.email,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          avatar: undefined,
          role: 'customer',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedUsers = [...users, newUser];
        this.saveToStorage(updatedUsers);

        const authResponse = this.generateAuthResponse(newUser);

        this.storeSession({
          user: newUser,
          token: authResponse.token,
          expiresAt: authResponse.expiresAt,
          refreshToken: this.generateRefreshToken(),
        });

        this.currentUserSubject.next(newUser);

        return of(authResponse);
      })
    );
  }

  logout(): Observable<boolean> {
    return this.simulateDelay().pipe(
      map(() => {
        this.clearSession();
        this.currentUserSubject.next(null);

        return true;
      })
    );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private generateAuthResponse(user: User): AuthResponse {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

    const token = this.generateJwtToken(user, expiresAt);

    return {
      user,
      token,
      expiresAt,
    };
  }

  private generateJwtToken(user: User, expiresAt: Date): string {
    const header = {
      typ: 'JWT',
      alg: 'HS256',
    };

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      iss: 'bookflow-mock-api',
      aud: 'bookflow-frontend',
    };

    const signature = this.generateRandomString(43);

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private generateRefreshToken(): string {
    return this.generateRandomString(32);
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private storeSession(session: AuthSession): void {
    try {
      localStorage.setItem(
        this.SESSION_KEY,
        JSON.stringify({
          ...session,
          user: session.user,
          expiresAt: session.expiresAt.toISOString(),
        })
      );
    } catch (error) {
      console.warn('Failed to store auth session:', error);
    }
  }

  private getStoredSession(): AuthSession | null {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt),
      };
    } catch (error) {
      console.warn('Failed to load auth session:', error);
      return null;
    }
  }

  private isSessionValid(session: AuthSession): boolean {
    return session.expiresAt.getTime() > Date.now();
  }

  private clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear auth session:', error);
    }
  }
}