export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly details: string;
}

export class ApiResponseError extends Error {
  readonly status: number;
  readonly errorType?: string;
  readonly timestamp?: string;
  readonly error?: string;
  readonly path?: string;
  readonly validationErrors?: ReadonlyArray<ValidationError>;

  constructor(
    message: string,
    status: number,
    options?: {
      errorType?: string;
      timestamp?: string;
      error?: string;
      path?: string;
      validationErrors?: ReadonlyArray<ValidationError>;
    },
  ) {
    super(message);
    this.status = status;
    this.errorType = options?.errorType;
    this.timestamp = options?.timestamp;
    this.error = options?.error;
    this.path = options?.path;
    this.validationErrors = options?.validationErrors;

    // Fix prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiResponseError.prototype);
  }

  get isValidationError(): boolean {
    return (this.validationErrors?.length ?? 0) > 0;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}
