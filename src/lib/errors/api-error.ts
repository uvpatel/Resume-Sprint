import { NextResponse } from 'next/server';
import { StandardErrorEnvelope } from '@/types/resume-sprint';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly recoveryAction: string;
  public readonly operationId: string;
  public readonly retryable: boolean;
  public readonly currentVersion?: number;

  constructor(params: {
    statusCode: number;
    code: string;
    message: string;
    recoveryAction: string;
    operationId?: string;
    retryable?: boolean;
    currentVersion?: number;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.recoveryAction = params.recoveryAction;
    this.operationId = params.operationId || `op_${Math.random().toString(36).substring(2, 11)}`;
    this.retryable = params.retryable ?? false;
    this.currentVersion = params.currentVersion;
  }

  public toEnvelope(): StandardErrorEnvelope {
    const envelope: StandardErrorEnvelope = {
      code: this.code,
      message: this.message,
      recoveryAction: this.recoveryAction,
      operationId: this.operationId,
      retryable: this.retryable,
    };
    if (this.currentVersion !== undefined) {
      envelope.currentVersion = this.currentVersion;
    }
    return envelope;
  }

  public toResponse(): NextResponse {
    return NextResponse.json(this.toEnvelope(), { status: this.statusCode });
  }

  // Pre-configured Error Factories
  static badRequest(message: string, recoveryAction = 'Review and correct input parameters', code = 'INVALID_REQUEST', operationId?: string) {
    return new ApiError({ statusCode: 400, code, message, recoveryAction, operationId, retryable: false });
  }

  static unauthenticated(message = 'Authentication required', recoveryAction = 'Sign in to access this resource', operationId?: string) {
    return new ApiError({ statusCode: 401, code: 'UNAUTHENTICATED', message, recoveryAction, operationId, retryable: false });
  }

  static unauthorized(message = 'Authentication required', recoveryAction = 'Sign in to access this resource', operationId?: string) {
    return ApiError.unauthenticated(message, recoveryAction, operationId);
  }

  static forbidden(message = 'You do not have access to this resource', recoveryAction = 'Verify your account permissions', operationId?: string) {
    return new ApiError({ statusCode: 403, code: 'FORBIDDEN', message, recoveryAction, operationId, retryable: false });
  }

  static notFound(resource = 'Resource', recoveryAction = 'Verify the identifier and try again', operationId?: string) {
    return new ApiError({ statusCode: 404, code: 'NOT_FOUND', message: `${resource} not found`, recoveryAction, operationId, retryable: false });
  }

  static conflict(message: string, currentVersion?: number, recoveryAction = 'Fetch the latest draft version and reconcile changes', operationId?: string) {
    return new ApiError({ statusCode: 409, code: 'STALE_VERSION', message, recoveryAction, operationId, retryable: false, currentVersion });
  }

  static unprocessable(message: string, recoveryAction = 'Review content constraints or unsupported claims', code = 'VALIDATION_FAILED', operationId?: string, currentVersion?: number) {
    return new ApiError({ statusCode: 422, code, message, recoveryAction, operationId, retryable: false, currentVersion });
  }

  static rateLimitExceeded(message = 'Too many requests. Please wait before retrying.', recoveryAction = 'Back off and retry in a few seconds', operationId?: string) {
    return new ApiError({ statusCode: 429, code: 'RATE_LIMIT_EXCEEDED', message, recoveryAction, operationId, retryable: true });
  }

  static serviceUnavailable(message = 'Service temporarily unavailable', recoveryAction = 'Retry after a short delay', operationId?: string) {
    return new ApiError({ statusCode: 503, code: 'SERVICE_UNAVAILABLE', message, recoveryAction, operationId, retryable: true });
  }
}

export function handleApiError(error: unknown, fallbackOperationId = 'op_default'): NextResponse {
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  const message = error instanceof Error ? error.message : 'An unexpected internal error occurred';
  const apiError = new ApiError({
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected internal error occurred. No sensitive details exposed.',
    recoveryAction: 'Retry the request or contact support if the issue persists.',
    operationId: fallbackOperationId,
    retryable: true,
  });
  console.error('[ApiError] Unexpected error caught:', message);
  return apiError.toResponse();
}
