import client from './client'
import type { BookingOrder, CancellationPreview, PlaceOrderRequest } from '../types/booking'

export const bookingApi = {
  getOrder: (orderId: number) =>
    client.get<BookingOrder>(`/booking-orders/${orderId}`).then((r) => r.data),

  placeOrder: (body: PlaceOrderRequest) =>
    client.post<BookingOrder>('/booking-orders', body).then((r) => r.data),

  confirm: (orderId: number) =>
    client.post<void>(`/booking-orders/${orderId}/confirm`),

  cancel: (orderId: number) =>
    client.post<void>(`/booking-orders/${orderId}/cancel`),

  /** Q7/Q9 — 호스트 발 강제 취소 (페널티 미부과 + 100% 환불) */
  hostCancel: (orderId: number, reason: string) =>
    client.post<void>(`/host/booking-orders/${orderId}/cancel`, { reason }),

  previewCancellation: (orderId: number) =>
    client
      .get<CancellationPreview>(`/booking-orders/${orderId}/cancellation-preview`)
      .then((r) => r.data),

  checkIn: (orderId: number) =>
    client.post<void>(`/booking-orders/${orderId}/check-in`),

  checkOut: (orderId: number) =>
    client.post<void>(`/booking-orders/${orderId}/check-out`),
}
