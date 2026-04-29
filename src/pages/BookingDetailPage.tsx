import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { bookingApi } from '../api/booking'
import BookingStatusBadge from '../components/BookingStatusBadge'
import ExpiryCountdown from '../components/ExpiryCountdown'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import type { BookingStatus, CancellationPreview } from '../types/booking'

export default function BookingDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const id = Number(orderId)
  const queryClient = useQueryClient()

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<CancellationPreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

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

  const invalidateWithAccommodation = () => {
    queryClient.invalidateQueries({ queryKey: ['booking', id] })
    queryClient.invalidateQueries({ queryKey: ['accommodation'] })
    queryClient.invalidateQueries({ queryKey: ['accommodations'] })
  }

  const confirm  = useMutation({ mutationFn: () => bookingApi.confirm(id),  onSuccess: invalidateWithAccommodation })
  const cancel   = useMutation({
    mutationFn: () => bookingApi.cancel(id),
    onSuccess: () => {
      invalidateWithAccommodation()
      setPreviewOpen(false)
      setPreviewData(null)
    },
  })
  const hostCancel = useMutation({
    mutationFn: (reason: string) => bookingApi.hostCancel(id, reason),
    onSuccess: invalidateWithAccommodation,
  })
  const preview  = useMutation({
    mutationFn: () => bookingApi.previewCancellation(id),
    onSuccess: (data) => {
      setPreviewData(data)
      setPreviewError(null)
      setPreviewOpen(true)
    },
    onError: (err) => {
      setPreviewError(err instanceof Error ? err.message : '취소 미리보기 조회 실패')
      setPreviewOpen(true)
    },
  })
  const checkIn  = useMutation({ mutationFn: () => bookingApi.checkIn(id),  onSuccess: invalidate })
  const checkOut = useMutation({ mutationFn: () => bookingApi.checkOut(id), onSuccess: invalidate })

  const anyPending = [confirm, cancel, preview, checkIn, checkOut, hostCancel].some((m) => m.isPending)
  const lastError  = [confirm, cancel, checkIn, checkOut, hostCancel].find((m) => m.isError)?.error

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 w-40 rounded bg-gray-200" /><div className="h-48 rounded-xl bg-gray-200" /></div>
  if (isError || !data) return <div className="rounded-lg bg-red-50 p-6 text-red-700">예약 정보를 불러오지 못했습니다.</div>

  const item = data.lineItems[0]

  const handleCancelClick = () => {
    setPreviewError(null)
    preview.mutate()
  }

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
        onCancel={handleCancelClick}
        onCheckIn={() => checkIn.mutate()}
        onCheckOut={() => checkOut.mutate()}
        loading={anyPending}
      />

      <HostActionPanel
        status={data.status}
        loading={anyPending}
        onHostCancel={(reason) => hostCancel.mutate(reason)}
      />

      {lastError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {lastError instanceof Error ? lastError.message : '오류가 발생했습니다.'}
        </p>
      )}

      {previewOpen && (
        <CancellationPreviewModal
          preview={previewData}
          errorMessage={previewError}
          loading={cancel.isPending}
          onClose={() => {
            setPreviewOpen(false)
            setPreviewData(null)
            setPreviewError(null)
          }}
          onConfirm={() => cancel.mutate()}
        />
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

function HostActionPanel({
  status,
  loading,
  onHostCancel,
}: {
  status: BookingStatus
  loading: boolean
  onHostCancel: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)

  if (status !== 'REQUESTED' && status !== 'CONFIRMED') return null

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">호스트 권한</h2>
            <p className="text-xs text-gray-500">시설 문제 등으로 호스트가 강제 취소 시 페널티 없이 100% 환불됩니다.</p>
          </div>
          {!open && (
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)} disabled={loading}>
              호스트 강제 취소
            </Button>
          )}
        </div>
        {open && (
          <div className="space-y-2 rounded-lg bg-yellow-50 p-3">
            <label className="text-xs font-medium text-yellow-900">취소 사유</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 시설 점검으로 인한 불가피한 취소"
              className="w-full rounded border border-yellow-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none"
              disabled={loading}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="danger"
                loading={loading}
                disabled={reason.trim().length === 0}
                onClick={() => onHostCancel(reason.trim())}
              >
                100% 환불 후 취소
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setOpen(false); setReason('') }} disabled={loading}>
                닫기
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function CancellationPreviewModal({
  preview,
  errorMessage,
  loading,
  onClose,
  onConfirm,
}: {
  preview: CancellationPreview | null
  errorMessage: string | null
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const fmt = (v: number | string) => Number(v).toLocaleString()
  const fmtRatio = (v: number | string) => {
    const n = Number(v)
    if (!Number.isFinite(n)) return '-'
    return `${(n * 100).toFixed(1)}%`
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-bold text-gray-900">예약 취소 확인</h3>

        {errorMessage ? (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
        ) : !preview ? (
          <p className="mb-4 text-sm text-gray-500">미리보기를 불러오는 중입니다…</p>
        ) : !preview.cancelable ? (
          <p className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            {preview.reasonIfNotCancelable ?? '현재 상태에서는 취소할 수 없습니다.'}
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600">
              호스트가 설정한 페널티 정책에 따라 아래 금액이 환불됩니다. 취소 후에는 되돌릴 수 없습니다.
            </p>
            <dl className="mb-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
              <DetailRow label="결제 금액" value={`${fmt(preview.paidAmount)}${preview.currency === 'KRW' ? '원' : ` ${preview.currency}`}`} />
              <DetailRow label="환불 금액" value={`${fmt(preview.refundAmount)}${preview.currency === 'KRW' ? '원' : ` ${preview.currency}`}`} strong />
              <DetailRow label="수수료" value={`${fmt(preview.penaltyAmount)}${preview.currency === 'KRW' ? '원' : ` ${preview.currency}`}`} />
              <DetailRow label="환불 비율" value={fmtRatio(preview.appliedRefundRatio)} />
              <DetailRow label="체크인까지" value={`${preview.daysUntilCheckIn}일`} />
            </dl>
          </>
        )}

        <div className="flex gap-3">
          <Button onClick={onClose} variant="secondary" className="flex-1" disabled={loading}>
            닫기
          </Button>
          {preview?.cancelable && (
            <Button onClick={onConfirm} variant="danger" className="flex-1" loading={loading}>
              취소 확정
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className={strong ? 'font-semibold text-blue-600' : 'text-gray-900'}>{value}</dd>
    </div>
  )
}
