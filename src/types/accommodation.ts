export type RoomScheduleType = 'BLOCKED' | 'MAINTENANCE' | 'OWNER_USE'

export interface CancellationPenaltyTier {
  minDaysToCheckIn: number
  /** 0.5 ~ 1.0 (페널티 최대 50%). 서버에서 BigDecimal 문자열로 내려올 수 있으므로 주의. */
  refundRatio: number | string
}

export interface AccommodationOperationPolicy {
  shortLeadTimeDays: number
  shortLeadTimeTtlMinutes: number
  longLeadTimeDays: number
  longLeadTimeTtlMinutes: number
  defaultTtlMinutes: number
  cancellationPenaltyTiers: CancellationPenaltyTier[]
}

export const DEFAULT_CANCELLATION_PENALTY_TIERS: CancellationPenaltyTier[] = [
  { minDaysToCheckIn: 7, refundRatio: 1.0 },
  { minDaysToCheckIn: 3, refundRatio: 0.7 },
  { minDaysToCheckIn: 0, refundRatio: 0.5 },
]

export const DEFAULT_OPERATION_POLICY: AccommodationOperationPolicy = {
  shortLeadTimeDays: 3,
  shortLeadTimeTtlMinutes: 20,
  longLeadTimeDays: 30,
  longLeadTimeTtlMinutes: 120,
  defaultTtlMinutes: 60,
  cancellationPenaltyTiers: DEFAULT_CANCELLATION_PENALTY_TIERS,
}

export interface BlockedDate {
  date: string
  type: RoomScheduleType
  reason: string | null
}

export interface Room {
  id: number
  name: string
  capacity: number
  pricePerNight: number
  currency: string
  operationPolicy: AccommodationOperationPolicy
  blockedDates: BlockedDate[]
  bookedDates: string[]
}

export interface Accommodation {
  id: number
  name: string
  address: string
  description: string | null
  hostName: string
  operationPolicy: AccommodationOperationPolicy
  /** ISO LocalTime (예: "15:00") — 자동 체크인 기준 시각 */
  checkInTime: string
  rooms: Room[]
}

export interface RegisterAccommodationRequest {
  name: string
  address: string
  description?: string
  hostName: string
  shortLeadTimeDays: number
  shortLeadTimeTtlMinutes: number
  longLeadTimeDays: number
  longLeadTimeTtlMinutes: number
  defaultTtlMinutes: number
  cancellationPenaltyTiers?: CancellationPenaltyTier[]
  /** ISO LocalTime "HH:mm" (예: "15:00"). 미지정 시 BE 기본값(15:00) 사용 */
  checkInTime?: string
}

export interface AddRoomRequest {
  roomName: string
  capacity: number
  pricePerNight: number
  shortLeadTimeDays: number
  shortLeadTimeTtlMinutes: number
  longLeadTimeDays: number
  longLeadTimeTtlMinutes: number
  defaultTtlMinutes: number
  cancellationPenaltyTiers?: CancellationPenaltyTier[]
}

export interface BlockScheduleRequest {
  date: string
  type: RoomScheduleType
  reason?: string
}

export interface BulkBlockScheduleRequest {
  dates: string[]
  type: RoomScheduleType
  reason?: string
}
