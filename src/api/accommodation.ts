import client from './client'
import type {
  Accommodation,
  RegisterAccommodationRequest,
  AddRoomRequest,
  BlockScheduleRequest,
  BulkBlockScheduleRequest,
} from '../types/accommodation'

export const accommodationApi = {
  listAll: () =>
    client.get<Accommodation[]>('/accommodations').then((r) => r.data),

  getOne: (id: number) =>
    client.get<Accommodation>(`/accommodations/${id}`).then((r) => r.data),

  register: (body: RegisterAccommodationRequest) =>
    client.post<number>('/accommodations', body).then((r) => r.data),

  addRoom: (accommodationId: number, body: AddRoomRequest) =>
    client.post<void>(`/accommodations/${accommodationId}/rooms`, body),

  blockSchedule: (
    accommodationId: number,
    roomId: number,
    body: BlockScheduleRequest,
  ) =>
    client.post<void>(
      `/accommodations/${accommodationId}/rooms/${roomId}/schedules/block`,
      body,
    ),

  blockScheduleBulk: (
    accommodationId: number,
    roomId: number,
    body: BulkBlockScheduleRequest,
  ) =>
    client.post<void>(
      `/accommodations/${accommodationId}/rooms/${roomId}/schedules/block/bulk`,
      body,
    ),

  unblockSchedule: (accommodationId: number, roomId: number, date: string) =>
    client.delete<void>(
      `/accommodations/${accommodationId}/rooms/${roomId}/schedules/block/${date}`,
    ),
}
