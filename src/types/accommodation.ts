export type RoomScheduleType = 'BLOCKED' | 'MAINTENANCE' | 'OWNER_USE'

export interface PreemptionPolicy {
  shortLeadTimeDays: number
  shortLeadTimeTtlMinutes: number
  longLeadTimeDays: number
  longLeadTimeTtlMinutes: number
  defaultTtlMinutes: number
}

export const DEFAULT_PREEMPTION_POLICY: PreemptionPolicy = {
  shortLeadTimeDays: 3,
  shortLeadTimeTtlMinutes: 20,
  longLeadTimeDays: 30,
  longLeadTimeTtlMinutes: 120,
  defaultTtlMinutes: 60,
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
  preemptionPolicy: PreemptionPolicy
  blockedDates: BlockedDate[]
  bookedDates: string[]
}

export interface Accommodation {
  id: number
  name: string
  address: string
  description: string | null
  hostName: string
  preemptionPolicy: PreemptionPolicy
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
