import { useState } from 'react'
import dayjs from 'dayjs'
import { useMutation } from '@tanstack/react-query'
import { bookingApi } from '../api/booking'
import Button from './ui/Button'
import type { LineItem, PartialCancellationPreview } from '../types/booking'

interface Props {
  orderId: number
  lineItem: LineItem
  onClose: () => void
  onSuccess: () => void
}

type Step = 'select' | 'preview' | 'done'

/**
 * 부분취소 모달.
 *
 * 단계:
 * 1. select — 날짜 선택 (첫날 포함 or 마지막날 포함 연속 구간 강제)
 * 2. preview — 환불액·페널티 확인
 * 3. 확정 후 onSuccess 콜백
 *
 * 날짜 선택 규칙 (결정 카드 #1):
 * - 활성 구간의 첫날(checkIn) 또는 마지막 박 마지막날(checkOut 전날)을 포함해야 한다.
 * - 연속 구간이어야 한다 → checkIn ≤ cancelCheckIn < cancelCheckOut ≤ checkOut
 * - 두 끝 중 하나만 활성 끝과 맞닿으면 유효.
 */
export default function PartialCancelModal({ orderId, lineItem, onClose, onSuccess }: Props) {
  const activeCheckIn = lineItem.checkIn   // 활성 구간 시작 (BE에서 활성 기준으로 내려줌)
  const activeCheckOut = lineItem.checkOut // 활성 구간 끝

  // 기본값: 마지막 1박만 선택 (마지막날 포함 정책 중 최소 선택)
  const defaultCancelCheckIn = dayjs(activeCheckOut).subtract(1, 'day').format('YYYY-MM-DD')
  const [cancelCheckIn, setCancelCheckIn] = useState(defaultCancelCheckIn)
  const [cancelCheckOut, setCancelCheckOut] = useState(activeCheckOut)
  const [step, setStep] = useState<Step>('select')
  const [preview, setPreview] = useState<PartialCancellationPreview | null>(null)

  // 날짜 선택 유효성 검사
  const validateRange = (): string | null => {
    if (!cancelCheckIn || !cancelCheckOut) return '날짜를 선택해주세요.'
    if (!dayjs(cancelCheckOut).isAfter(dayjs(cancelCheckIn))) return '체크아웃은 체크인보다 이후여야 합니다.'
    if (dayjs(cancelCheckIn).isBefore(dayjs(activeCheckIn))) return '활성 구간 시작일보다 이전을 선택할 수 없습니다.'
    if (dayjs(cancelCheckOut).isAfter(dayjs(activeCheckOut))) return '활성 구간 종료일보다 이후를 선택할 수 없습니다.'

    const startsAtFirst = cancelCheckIn === activeCheckIn
    const endsAtLast = cancelCheckOut === activeCheckOut
    if (!startsAtFirst && !endsAtLast) {
      return '부분취소는 첫날 또는 마지막날을 포함한 연속 구간만 가능합니다.'
    }
    return null
  }

  const validationError = validateRange()

  const previewMutation = useMutation({
    mutationFn: () =>
      bookingApi.previewPartialCancellation(orderId, lineItem.lineItemId, cancelCheckIn, cancelCheckOut),
    onSuccess: (data) => {
      setPreview(data)
      setStep('preview')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () =>
      bookingApi.partialCancel(orderId, lineItem.lineItemId, cancelCheckIn, cancelCheckOut),
    onSuccess: () => {
      setStep('done')
      onSuccess()
    },
  })

  const fmt = (v: number) => Number(v).toLocaleString()
  const nights = dayjs(cancelCheckOut).diff(dayjs(cancelCheckIn), 'day')

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-bold text-gray-900">부분취소</h3>

        {step === 'select' && (
          <>
            <p className="mb-4 text-sm text-gray-600">
              취소할 날짜 구간을 선택하세요. <br />
              <span className="text-yellow-700 font-medium">
                첫날({dayjs(activeCheckIn).format('MM/DD')}) 또는 마지막날({dayjs(activeCheckOut).subtract(1, 'day').format('MM/DD')})을 포함한 연속 구간만 가능합니다.
              </span>
            </p>

            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">취소 시작일 (체크인)</label>
                <input
                  type="date"
                  value={cancelCheckIn}
                  min={activeCheckIn}
                  max={dayjs(cancelCheckOut).subtract(1, 'day').format('YYYY-MM-DD')}
                  onChange={(e) => setCancelCheckIn(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">취소 종료일 (체크아웃)</label>
                <input
                  type="date"
                  value={cancelCheckOut}
                  min={dayjs(cancelCheckIn).add(1, 'day').format('YYYY-MM-DD')}
                  max={activeCheckOut}
                  onChange={(e) => setCancelCheckOut(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {validationError ? (
              <p className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">{validationError}</p>
            ) : (
              <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                {nights}박 ({dayjs(cancelCheckIn).format('MM/DD')} ~ {dayjs(cancelCheckOut).format('MM/DD')}) 부분취소 예정
              </p>
            )}

            {previewMutation.isError && (
              <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {previewMutation.error instanceof Error ? previewMutation.error.message : '미리보기 조회 실패'}
              </p>
            )}

            <div className="flex gap-3">
              <Button onClick={onClose} variant="secondary" className="flex-1" disabled={previewMutation.isPending}>
                닫기
              </Button>
              <Button
                onClick={() => previewMutation.mutate()}
                className="flex-1"
                loading={previewMutation.isPending}
                disabled={!!validationError}
              >
                다음 (환불 확인)
              </Button>
            </div>
          </>
        )}

        {step === 'preview' && preview && (
          <>
            {!preview.partialCancelable ? (
              <div className="mb-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                <p className="font-medium">부분취소가 불가합니다</p>
                <p className="mt-1">{preview.reasonMessage ?? '현재 정책상 부분취소를 진행할 수 없습니다.'}</p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600">
                  아래 내용으로 부분취소를 진행합니다. 취소 후에는 되돌릴 수 없습니다.
                </p>
                <dl className="mb-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
                  <DetailRow label="취소 기간"
                    value={`${dayjs(preview.cancelCheckIn).format('YYYY.MM.DD')} ~ ${dayjs(preview.cancelCheckOut).format('YYYY.MM.DD')} (${preview.cancelNights}박)`} />
                  <DetailRow label="취소 금액" value={`${fmt(preview.cancelledAmount)}${preview.currency === 'KRW' ? '원' : ` ${preview.currency}`}`} />
                  <DetailRow label="환불 금액" value={`${fmt(preview.refundAmount)}${preview.currency === 'KRW' ? '원' : ` ${preview.currency}`}`} strong />
                  <DetailRow label="수수료(페널티)" value={`${fmt(preview.penaltyAmount)}${preview.currency === 'KRW' ? '원' : ` ${preview.currency}`}`} />
                  <DetailRow label="환불 비율" value={`${(Number(preview.refundRatio) * 100).toFixed(1)}%`} />
                </dl>
              </>
            )}

            {cancelMutation.isError && (
              <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {cancelMutation.error instanceof Error ? cancelMutation.error.message : '부분취소 실패'}
              </p>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setStep('select')} variant="secondary" className="flex-1" disabled={cancelMutation.isPending}>
                뒤로
              </Button>
              {preview.partialCancelable && (
                <Button
                  onClick={() => cancelMutation.mutate()}
                  variant="danger"
                  className="flex-1"
                  loading={cancelMutation.isPending}
                >
                  부분취소 확정
                </Button>
              )}
              {!preview.partialCancelable && (
                <Button onClick={onClose} className="flex-1">닫기</Button>
              )}
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <p className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
              부분취소가 완료됐습니다. 환불 처리가 진행됩니다.
            </p>
            <Button onClick={onClose} className="w-full">닫기</Button>
          </>
        )}
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
