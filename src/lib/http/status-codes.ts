export const STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  BAD_GATEWAY: 502,
  INTERNAL_ERROR: 500,
} as const;

export type StatusCode = (typeof STATUS)[keyof typeof STATUS];
