// Define a type for HTTP status codes
type HttpStatusCode = number;

export class AuthError extends Error {
  constructor(
    public statusCode: HttpStatusCode,
    message: string,
  ) {
    super(message);
  }
}
