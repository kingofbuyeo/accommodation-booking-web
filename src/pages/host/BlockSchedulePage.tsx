import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft } from 'lucide-react'
import dayjs from 'dayjs'
import { accommodationApi } from '../../api/accommodation'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import HostCalendar from '../../components/HostCalendar'
import type { RoomScheduleType } from '../../types/accommodation'

const schema = z.object({
  type:   z.enum(['BLOCKED', 'MAINTENANCE', 'OWNER_USE'] as const),
  reason: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const typeOptions: { value: RoomScheduleType; label: string }[] = [
  { value: 'BLOCKED',     label: '차단' },
  { value: 'MAINTENANCE', label: '점검/청소' },
  { value: 'OWNER_USE',   label: '호스트 사용' },
]

const typeLabel = (type: RoomScheduleType) =>
  typeOptions.find((o) => o.value === type)?.label ?? type

export default function BlockSchedulePage() {
  const { accommodationId, roomId } = useParams<{ accommodationId: string; roomId: string }>()
  const accId = Number(accommodationId)
  const rmId  = Number(roomId)
  const queryClient = useQueryClient()

  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())

  const { data: accommodation } = useQuery({
    queryKey: ['accommodation', accId],
    queryFn: () => accommodationApi.getOne(accId),
    enabled: !isNaN(accId),
    staleTime: 0,
  })

  const room = accommodation?.rooms.find((r) => r.id === rmId)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'BLOCKED' },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['accommodation', accId] })

  const blockMutation = useMutation({
    mutationFn: (values: FormValues) =>
      accommodationApi.blockScheduleBulk(accId, rmId, {
        dates: Array.from(selectedDates).sort(),
        type: values.type,
        reason: values.reason || undefined,
      }),
    onSuccess: () => {
      invalidate()
      setSelectedDates(new Set())
      reset()
    },
  })

  const unblockMutation = useMutation({
    mutationFn: (date: string) => accommodationApi.unblockSchedule(accId, rmId, date),
    onSuccess: invalidate,
  })

  const toggleDate = (date: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  const sortedSelected = Array.from(selectedDates).sort()

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          to="/host"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" /> 호스트 관리로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">예약 불가 일정 설정</h1>
        {accommodation && room && (
          <p className="mt-1 text-sm text-gray-500">
            {accommodation.name} · {room.name}
          </p>
        )}
      </div>

      {/* 달력 */}
      <Card>
        <h2 className="mb-4 font-semibold text-gray-800">날짜 선택</h2>
        <p className="mb-3 text-xs text-gray-500">
          차단할 날짜를 여러 개 선택한 뒤 아래 폼에서 일괄 적용하세요.
        </p>
        {room ? (
          <HostCalendar
            blockedDates={room.blockedDates}
            bookedDates={room.bookedDates}
            selectedDates={selectedDates}
            onToggleDate={toggleDate}
            onUnblock={(date) => unblockMutation.mutate(date)}
            isUnblocking={unblockMutation.isPending}
          />
        ) : (
          <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
        )}
      </Card>

      {/* 차단 설정 폼 — 날짜가 1개 이상 선택됐을 때만 표시 */}
      {selectedDates.size > 0 && (
        <Card>
          <h2 className="mb-1 font-semibold text-gray-800">선택한 날짜 차단 설정</h2>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {sortedSelected.map((d) => (
              <span
                key={d}
                className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
              >
                {dayjs(d).format('M/D')}
                <button
                  type="button"
                  onClick={() => toggleDate(d)}
                  className="ml-0.5 text-blue-400 hover:text-blue-600"
                  aria-label={`${d} 선택 해제`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleSubmit((v) => blockMutation.mutate(v))} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">차단 유형</label>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register('type')}
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="reason" className="text-sm font-medium text-gray-700">사유 (선택)</label>
              <input
                id="reason"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="차단 사유 (예: 정기 청소, 개인 사용...)"
                {...register('reason')}
              />
            </div>

            {blockMutation.isError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {blockMutation.error instanceof Error
                  ? blockMutation.error.message
                  : '오류가 발생했습니다.'}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => { setSelectedDates(new Set()); reset() }}
              >
                선택 취소
              </Button>
              <Button type="submit" className="flex-1" loading={blockMutation.isPending}>
                {selectedDates.size}일 차단하기
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 차단된 날짜 목록 */}
      {room && room.blockedDates.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold text-gray-800">
            차단된 날짜 ({room.blockedDates.length}일)
          </h2>
          <div className="space-y-2">
            {[...room.blockedDates]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((bd) => (
                <div
                  key={bd.date}
                  className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium text-red-700">
                      {dayjs(bd.date).format('YYYY. M. D.')}
                    </span>
                    <span className="ml-2 text-xs text-red-400">
                      {typeLabel(bd.type)}
                      {bd.reason && ` · ${bd.reason}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => unblockMutation.mutate(bd.date)}
                    disabled={unblockMutation.isPending}
                    className="ml-3 text-xs text-red-500 underline hover:text-red-700 disabled:opacity-50"
                  >
                    해제
                  </button>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}
