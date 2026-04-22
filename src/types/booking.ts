export type BookingStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'EXPIRED'

export interface LineItem {
  accommodationName: string
  roomName: string
  checkIn: string
  checkOut: string
  nights: number
  lineTotal: number
}

export interface BookingOrder {
  orderId: number
  status: BookingStatus
  guestName: string
  totalAmount: number
  currency: string
  lineItems: LineItem[]
  createdAt: string
  expiresAt?: string   // REQUESTED 상태일 때만 존재
}

export interface PlaceOrderRequest {
  accommodationId: number
  roomId: number
  checkIn: string
  checkOut: string
  guestName: string
  phone: string
  headcount: number
}
