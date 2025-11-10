import { StatusCode } from './status-codes';

export interface HttpErrorProps {
  code: StatusCode;
  msg: string;
}

export class HttpError extends Error {
  private code: StatusCode;

  constructor({ code, msg }: HttpErrorProps) {
    super(`[${code}] ${msg}`);
    this.code = code;
  }

  public getCode() {
    return this.code;
  }
}
