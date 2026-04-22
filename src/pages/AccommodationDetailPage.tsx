import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { MapPin, User, Users, ChevronLeft } from 'lucide-react'
import { accommodationApi } from '../api/accommodation'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import type { Room } from '../types/accommodation'

export default function AccommodationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const accommodationId = Number(id)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['accommodation', accommodationId],
    queryFn: () => accommodationApi.getOne(accommodationId),
    enabled: !isNaN(accommodationId),
  })

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 rounded bg-gray-200" /><div className="h-48 rounded-xl bg-gray-200" /></div>
  if (isError || !data)
    return <div className="rounded-lg bg-red-50 p-6 text-red-700">숙소 정보를 불러오지 못했습니다.</div>

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{data.address}</span>
          <span className="flex items-center gap-1"><User className="h-4 w-4" />호스트: {data.hostName}</span>
        </div>
        {data.description && <p className="mt-3 text-sm text-gray-600">{data.description}</p>}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">객실 목록</h2>
        {data.rooms.length === 0 ? (
          <p className="text-gray-500">등록된 객실이 없습니다.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.rooms.map((room) => (
              <RoomCard key={room.id} room={room} accommodationId={data.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RoomCard({ room, accommodationId }: { room: Room; accommodationId: number }) {
  return (
    <Card padding={false}>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900">{room.name}</h3>
          <span className="text-base font-bold text-blue-600">
            {room.pricePerNight.toLocaleString()}원
            <span className="text-xs font-normal text-gray-400"> /박</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" /> 최대 {room.capacity}인
          </span>
        </div>

        <Link to={`/book/${accommodationId}/${room.id}`}>
          <Button className="w-full" size="md">
            예약하기
          </Button>
        </Link>
      </div>
    </Card>
  )
}
