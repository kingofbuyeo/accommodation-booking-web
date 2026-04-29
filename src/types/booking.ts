export type BookingStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'EXPIRED'

export interface CancelledRange {
  checkIn: string
  checkOut: string
  nights: number
}

export interface LineItem {
  lineItemId: number
  accommodationName: string
  roomName: string
  checkIn: string
  checkOut: string
  nights: number
  activeNights: number
  lineTotal: number
  partialCancelEnabled: boolean | null
  cancelledRanges: CancelledRange[]
}

export interface BookingOrder {
  orderId: number
  status: BookingStatus
  guestName: string
  totalAmount: number
  currency: string
  lineItems: LineItem[]
  createdAt: string
  expiresAt?: string
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

export interface CancellationPreview {
  bookingOrderId: number
  paidAmount: number | string
  refundAmount: number | string
  penaltyAmount: number | string
  currency: string
  appliedRefundRatio: number | string
  daysUntilCheckIn: number
  cancelable: boolean
  reasonIfNotCancelable: string | null
}

// Week3 신규: 부분취소
export interface PartialCancellationPreview {
  orderId: number
  lineItemId: number
  cancelCheckIn: string
  cancelCheckOut: string
  cancelNights: number
  cancelledAmount: number
  refundAmount: number
  penaltyAmount: number
  currency: string
  refundRatio: number
  partialCancelable: boolean
  reasonCode: string | null
  reasonMessage: string | null
}

export interface PartialCancelResult {
  orderId: number
  refundAmount: number
  penaltyAmount: number
  currency: string
  remainingNights: number
  convertedToFullCancel: boolean
}
