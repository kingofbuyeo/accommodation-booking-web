import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MapPin, User, ChevronRight, BedDouble } from 'lucide-react'
import { accommodationApi } from '../api/accommodation'
import Card from '../components/ui/Card'

export default function AccommodationListPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['accommodations'],
    queryFn: accommodationApi.listAll,
  })

  if (isLoading) return <LoadingSkeleton />
  if (isError)
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-red-700">
        숙소 목록을 불러오지 못했습니다.
      </div>
    )
  if (!data?.length)
    return (
      <div className="rounded-lg bg-gray-50 p-12 text-center text-gray-500">
        <BedDouble className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p>등록된 숙소가 없습니다.</p>
        <Link to="/host/accommodations/new" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
          숙소 등록하기
        </Link>
      </div>
    )

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">숙소 목록</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {data.map((acc) => {
          const minPrice = acc.rooms.length
            ? Math.min(...acc.rooms.map((r) => r.pricePerNight))
            : null
          return (
            <Link key={acc.id} to={`/accommodations/${acc.id}`}>
              <Card className="group h-full transition-shadow hover:shadow-md" padding={false}>
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
                      {acc.name}
                    </h2>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 group-hover:text-blue-500" />
                  </div>

                  {acc.description && (
                    <p className="line-clamp-2 text-sm text-gray-500">{acc.description}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {acc.address}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {acc.hostName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      객실 {acc.rooms.length}개
                    </span>
                    {minPrice != null && (
                      <span className="text-sm font-medium text-blue-600">
                        1박 {minPrice.toLocaleString()}원~
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200" />
      ))}
    </div>
  )
}
