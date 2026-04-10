/**
 * Standard envelope for all API responses to ensure 
 * consistent error handling in Astro components.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  /** Use for Zod/Validation errors keyed by field name */
  errors?: Record<string, string[]>; 
  /** The generated ID/Slug of the content, useful for redirects */
  id?: string; 
}

/**
 * Standardized status codes for use in API routes.
 */
export const API_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;