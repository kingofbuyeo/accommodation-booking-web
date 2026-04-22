import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { bookingApi } from '../api/booking'
import BookingStatusBadge from '../components/BookingStatusBadge'
import ExpiryCountdown from '../components/ExpiryCountdown'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import type { BookingStatus } from '../types/booking'

export default function BookingDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const id = Number(orderId)
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.getOrder(id),
    enabled: !isNaN(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'REQUESTED' || status === 'CONFIRMED' ? 5_000 : false
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['booking', id] })

  // 결제 확정/취소 시 확정 예약일이 변경되므로 accommodation 캐시도 무효화
  const invalidateWithAccommodation = () => {
    queryClient.invalidateQueries({ queryKey: ['booking', id] })
    queryClient.invalidateQueries({ queryKey: ['accommodation'] })
    queryClient.invalidateQueries({ queryKey: ['accommodations'] })
  }

  const confirm  = useMutation({ mutationFn: () => bookingApi.confirm(id),  onSuccess: invalidateWithAccommodation })
  const cancel   = useMutation({ mutationFn: () => bookingApi.cancel(id),   onSuccess: invalidateWithAccommodation })
  const checkIn  = useMutation({ mutationFn: () => bookingApi.checkIn(id),  onSuccess: invalidate })
  const checkOut = useMutation({ mutationFn: () => bookingApi.checkOut(id), onSuccess: invalidate })

  const anyPending = [confirm, cancel, checkIn, checkOut].some((m) => m.isPending)
  const lastError  = [confirm, cancel, checkIn, checkOut].find((m) => m.isError)?.error

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 w-40 rounded bg-gray-200" /><div className="h-48 rounded-xl bg-gray-200" /></div>
  if (isError || !data) return <div className="rounded-lg bg-red-50 p-6 text-red-700">예약 정보를 불러오지 못했습니다.</div>

  const item = data.lineItems[0]

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">예약 #{data.orderId}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {dayjs(data.createdAt).format('YYYY년 MM월 DD일 HH:mm')} 예약
          </p>
        </div>
        <BookingStatusBadge status={data.status} />
      </div>

      {data.status === 'REQUESTED' && data.expiresAt && (
        <ExpiryCountdown
          expiresAt={data.expiresAt}
          onExpired={invalidate}
        />
      )}

      {item && (
        <Card>
          <h2 className="mb-3 font-semibold text-gray-800">숙박 정보</h2>
          <dl className="space-y-2 text-sm">
            <Row label="숙소"    value={item.accommodationName} />
            <Row label="객실"    value={item.roomName} />
            <Row label="체크인"  value={dayjs(item.checkIn).format('YYYY.MM.DD (ddd)')} />
            <Row label="체크아웃" value={dayjs(item.checkOut).format('YYYY.MM.DD (ddd)')} />
            <Row label="투숙일"  value={`${item.nights}박`} />
            <div className="border-t border-gray-100 pt-2">
              <Row
                label="결제 금액"
                value={`${data.totalAmount.toLocaleString()}${data.currency === 'KRW' ? '원' : ` ${data.currency}`}`}
                bold
              />
            </div>
          </dl>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-semibold text-gray-800">예약자 정보</h2>
        <dl className="space-y-2 text-sm">
          <Row label="이름" value={data.guestName} />
        </dl>
      </Card>

      <ActionPanel
        status={data.status}
        onConfirm={() => confirm.mutate()}
        onCancel={() => cancel.mutate()}
        onCheckIn={() => checkIn.mutate()}
        onCheckOut={() => checkOut.mutate()}
        loading={anyPending}
      />

      {lastError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {lastError instanceof Error ? lastError.message : '오류가 발생했습니다.'}
        </p>
      )}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className={bold ? 'font-semibold text-blue-600' : 'text-gray-900'}>{value}</dd>
    </div>
  )
}

function ActionPanel({
  status,
  onConfirm,
  onCancel,
  onCheckIn,
  onCheckOut,
  loading,
}: {
  status: BookingStatus
  onConfirm: () => void
  onCancel: () => void
  onCheckIn: () => void
  onCheckOut: () => void
  loading: boolean
}) {
  if (status === 'CHECKED_OUT' || status === 'EXPIRED') return null

  return (
    <div className="flex flex-wrap gap-3">
      {status === 'REQUESTED' && (
        <>
          <Button onClick={onConfirm} loading={loading} className="flex-1">
            결제 확정
          </Button>
          <Button onClick={onCancel} variant="danger" loading={loading} className="flex-1">
            예약 취소
          </Button>
        </>
      )}
      {status === 'CONFIRMED' && (
        <>
          <Button onClick={onCheckIn} loading={loading} className="flex-1">
            체크인
          </Button>
          <Button onClick={onCancel} variant="danger" loading={loading} className="flex-1">
            예약 취소
          </Button>
        </>
      )}
      {status === 'CHECKED_IN' && (
        <Button onClick={onCheckOut} loading={loading} className="flex-1">
          체크아웃
        </Button>
      )}
      {status === 'CANCELLED' && (
        <p className="text-sm text-gray-500">취소된 예약입니다.</p>
      )}
    </div>
  )
}
