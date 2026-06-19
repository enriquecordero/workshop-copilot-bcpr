export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly description: string;

  constructor(message: string, statusCode: number, errorCode: string, description: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.description = description;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
