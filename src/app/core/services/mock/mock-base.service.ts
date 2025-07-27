import { Injectable, inject } from '@angular/core';
import { Observable, Subject, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { MockConfigService } from './mock.config';
import { PaginationResult, MockErrorOptions } from '../../models';

@Injectable({
  providedIn: 'root',
})
export abstract class MockBaseService<T> {
  protected storageKey!: string;
  protected defaultData: T[] = [];
  protected updateSubject = new Subject<T[]>();
  protected configService = inject(MockConfigService);

  protected constructor() {
    this.initializeStorage();
  }

  protected initializeStorage(): void {
    const config = this.configService.getConfig();
    if (config.persistToLocalStorage && !this.getStoredData()) {
      this.saveToStorage(this.defaultData);
    }
  }

  protected simulateDelay(): Observable<void> {
    const delayMs = this.configService.getRandomDelay();
    return of(void 0).pipe(delay(delayMs));
  }

  protected simulateError<R>(options: MockErrorOptions = {}): Observable<R> {
    if (this.configService.shouldSimulateError()) {
      const error = {
        message: options.message || 'Mock API Error - This is a simulated error for testing',
        code: options.code || 'MOCK_ERROR',
        status: options.status || 500,
        timestamp: new Date().toISOString(),
      };

      return throwError(() => error);
    }
    return of(null as unknown as R);
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected paginateResults<R>(items: R[], page: number = 1, limit: number = 10): PaginationResult<R> {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / limit);

    return {
      items: paginatedItems,
      total: items.length,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  protected saveToStorage(data: T[]): void {
    const config = this.configService.getConfig();

    if (!config.persistToLocalStorage) {
      this.emitUpdate(data);
      return;
    }
    console.log('saving to storage', data);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this.emitUpdate(data);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  public getStoredData(): T[] | null {
    const config = this.configService.getConfig();

    if (!config.persistToLocalStorage) {
      return this.defaultData;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }

  protected addToMockData(item: T): Observable<T> {
    return this.simulateDelay().pipe(
      map(() => {
        const currentData = this.getStoredData() || [];
        const newItem = { ...item, id: this.generateId() } as T;
        const updatedData = [...currentData, newItem];
        this.saveToStorage(updatedData);
        return newItem;
      })
    );
  }

  protected updateInMockData(id: string, updates: Partial<T>): Observable<T> {
    return this.simulateDelay().pipe(
      map(() => {
        const currentData = this.getStoredData() || [];
        const index = currentData.findIndex((item) => (item as Record<string, unknown>)['id'] === id);

        if (index === -1) {
          throw new Error(`Item with id ${id} not found`);
        }

        const updatedItem = { ...currentData[index], ...updates } as T;
        currentData[index] = updatedItem;
        this.saveToStorage(currentData);
        return updatedItem;
      })
    );
  }

  protected deleteFromMockData(id: string): Observable<boolean> {
    return this.simulateDelay().pipe(
      map(() => {
        const currentData = this.getStoredData() || [];
        const filteredData = currentData.filter((item) => (item as Record<string, unknown>)['id'] !== id);

        if (filteredData.length === currentData.length) {
          throw new Error(`Item with id ${id} not found`);
        }

        this.saveToStorage(filteredData);
        return true;
      })
    );
  }

  protected getAllFromMockData(page?: number, limit?: number): Observable<T[] | PaginationResult<T>> {
    return this.simulateDelay().pipe(
      map(() => {
        const data = this.getStoredData() || [];

        if (page && limit) {
          return this.paginateResults(data, page, limit);
        }

        return data;
      })
    );
  }

  protected getByIdFromMockData(id: string): Observable<T> {
    return this.simulateDelay().pipe(
      map(() => {
        const data = this.getStoredData() || [];
        const item = data.find((item) => (item as Record<string, unknown>)['id'] === id);

        if (!item) {
          throw new Error(`Item with id ${id} not found`);
        }

        return item;
      })
    );
  }

  protected searchInMockData(
    searchTerm: string,
    searchFields: (keyof T)[],
    page?: number,
    limit?: number
  ): Observable<T[] | PaginationResult<T>> {
    return this.simulateDelay().pipe(
      map(() => {
        const data = this.getStoredData() || [];
        const filteredData = data.filter((item) =>
          searchFields.some((field) =>
            (item as Record<string, unknown>)[field as string]
              ?.toString()
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          )
        );

        if (page && limit) {
          return this.paginateResults(filteredData, page, limit);
        }

        return filteredData;
      })
    );
  }

  public resetMockData(): void {
    this.saveToStorage(this.defaultData);
  }

  public loadTestData(testData: T[]): void {
    this.saveToStorage(testData);
  }

  private emitUpdate(data: T[]): void {
    this.updateSubject.next(data);
  }

  public cleanup(): void {
    this.updateSubject.complete();
  }
}
