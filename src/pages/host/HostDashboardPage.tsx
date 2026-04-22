import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PlusCircle, ChevronRight, BedDouble, Calendar } from 'lucide-react'
import { accommodationApi } from '../../api/accommodation'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

export default function HostDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['accommodations'],
    queryFn: accommodationApi.listAll,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">호스트 관리</h1>
        <Link to="/host/accommodations/new">
          <Button>
            <PlusCircle className="h-4 w-4" />
            숙소 등록
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      )}

      {data?.length === 0 && (
        <div className="rounded-xl bg-gray-50 p-12 text-center">
          <BedDouble className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">등록된 숙소가 없습니다.</p>
        </div>
      )}

      {data?.map((acc) => (
        <Card key={acc.id} padding={false}>
          <div className="p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{acc.name}</h2>
                <p className="text-sm text-gray-500">{acc.address}</p>
              </div>
              <span className="text-xs text-gray-400">ID: {acc.id}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to={`/host/accommodations/${acc.id}/rooms/new`}>
                <Button variant="secondary" size="sm">
                  <PlusCircle className="h-3.5 w-3.5" />
                  객실 추가
                </Button>
              </Link>
              {acc.rooms.map((room) => (
                <Link key={room.id} to={`/host/accommodations/${acc.id}/rooms/${room.id}/block`}>
                  <Button variant="ghost" size="sm">
                    <Calendar className="h-3.5 w-3.5" />
                    {room.name} 예약 불가 일정 설정
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
