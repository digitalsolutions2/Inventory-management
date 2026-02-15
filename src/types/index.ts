export interface UserContext {
  id: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantName: string;
  role: string;
  permissions: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
