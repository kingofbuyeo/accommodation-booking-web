import client from './client'
import type { BookingOrder, PlaceOrderRequest } from '../types/booking'

export const bookingApi = {
  getOrder: (orderId: number) =>
    client.get<BookingOrder>(`/booking-orders/${orderId}`).then((r) => r.data),

  placeOrder: (body: PlaceOrderRequest) =>
    client.post<BookingOrder>('/booking-orders', body).then((r) => r.data),

  confirm: (orderId: number) =>
    client.post<void>(`/booking-orders/${orderId}/confirm`),

  cancel: (orderId: number) =>
    client.post<void>(`/booking-orders/${orderId}/cancel`),

  checkIn: (orderId: number) =>
    client.post<void>(`/booking-orders/${orderId}/check-in`),

  checkOut: (orderId: number) =>
    client.post<void>(`/booking-orders/${orderId}/check-out`),
}
