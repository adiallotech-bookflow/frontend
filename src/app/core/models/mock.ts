export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MockErrorOptions {
  message?: string;
  code?: string;
  status?: number;
}

export interface MockConfig {
  delayMin: number;
  delayMax: number;
  errorRate: number;
  autoGenerateActivity: boolean;
  persistToLocalStorage: boolean;
  enableLogging: boolean;
  enabledServices: {
    appointments: boolean;
    auth: boolean;
    [key: string]: boolean;
  };
}