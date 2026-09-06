export class AppError extends Error {
  constructor(public statusCode: number, message: string, public code = statusCode) {
    super(message)
    this.name = 'AppError'
  }
}
