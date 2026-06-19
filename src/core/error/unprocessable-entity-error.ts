import { BaseError } from './base-error';

export class UnprocessableEntityError extends BaseError {
  constructor(message: string, description = 'Unprocessable entity') {
    super(message, 422, 'UNPROCESSABLE_ENTITY', description);
  }
}
