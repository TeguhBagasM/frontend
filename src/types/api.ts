export type ApiSuccessResponse<T> = {
  success: true
  message: string
  data: T
}

export type ApiErrorResponse = {
  success: false
  message: string
  errors?: Array<{ path: string; message: string }>
}