import { BaseError } from './base-error';

export class NotFoundError extends BaseError {
  constructor(message: string, description = 'Resource not found') {
    super(message, 404, 'NOT_FOUND', description);
  }
}
