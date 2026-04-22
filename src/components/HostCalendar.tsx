import { useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BlockedDate } from '../types/accommodation'

interface Props {
  blockedDates: BlockedDate[]
  bookedDates: string[]
  selectedDates: Set<string>
  onToggleDate: (date: string) => void
  onUnblock: (date: string) => void
  isUnblocking: boolean
}

export default function HostCalendar({
  blockedDates,
  bookedDates,
  selectedDates,
  onToggleDate,
  onUnblock,
  isUnblocking,
}: Props) {
  const today = dayjs()
  const [viewDate, setViewDate] = useState(() => today.startOf('month'))
  const [pendingUnblock, setPendingUnblock] = useState<string | null>(null)

  const blockedSet = new Set(blockedDates.map((b) => b.date))
  const bookedSet = new Set(bookedDates)

  const startOfMonth = viewDate.startOf('month')
  const firstDow = startOfMonth.day()
  const daysInMonth = viewDate.daysInMonth()
  const cells: (Dayjs | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(viewDate.date(d))
  while (cells.length % 7 !== 0) cells.push(null)

  const handleClick = (day: Dayjs) => {
    const ds = day.format('YYYY-MM-DD')
    if (day.isBefore(today, 'day')) return
    if (bookedSet.has(ds)) return

    if (blockedSet.has(ds)) {
      setPendingUnblock(pendingUnblock === ds ? null : ds)
      return
    }
    setPendingUnblock(null)
    onToggleDate(ds)
  }

  const getCellClass = (day: Dayjs): string => {
    const ds = day.format('YYYY-MM-DD')
    const base = 'h-9 w-full flex items-center justify-center text-sm transition-colors rounded-lg'
    if (day.isBefore(today, 'day')) return `${base} text-gray-300 cursor-not-allowed`
    if (bookedSet.has(ds))    return `${base} bg-orange-100 text-orange-700 cursor-default font-medium`
    if (blockedSet.has(ds))   return `${base} bg-red-100 text-red-600 line-through cursor-pointer hover:bg-red-200`
    if (selectedDates.has(ds)) return `${base} bg-blue-600 text-white font-semibold cursor-pointer`
    return `${base} text-gray-700 hover:bg-gray-100 cursor-pointer`
  }

  return (
    <div className="w-full select-none">
      {/* 선택 현황 */}
      {selectedDates.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm">
          <span className="text-blue-700">
            {selectedDates.size}일 선택됨
          </span>
          <button
            type="button"
            onClick={() => selectedDates.forEach((d) => onToggleDate(d))}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            전체 해제
          </button>
        </div>
      )}

      {/* 월 네비게이션 */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate((v) => v.subtract(1, 'month'))}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-gray-800">{viewDate.format('YYYY년 M월')}</span>
        <button
          type="button"
          onClick={() => setViewDate((v) => v.add(1, 'month'))}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="mb-1 grid grid-cols-7">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d} className="flex h-8 items-center justify-center text-xs font-medium text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 셀 */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) =>
          day ? (
            <div
              key={day.format('YYYY-MM-DD')}
              className={getCellClass(day)}
              onClick={() => handleClick(day)}
            >
              {day.date()}
            </div>
          ) : (
            <div key={`e${i}`} className="h-9" />
          ),
        )}
      </div>

      {/* 차단 해제 인라인 확인 */}
      {pendingUnblock && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2.5">
          <span className="text-sm text-red-700">
            {dayjs(pendingUnblock).format('M월 D일')} 차단을 해제할까요?
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPendingUnblock(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              취소
            </button>
            <button
              type="button"
              disabled={isUnblocking}
              onClick={() => { onUnblock(pendingUnblock); setPendingUnblock(null) }}
              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              해제
            </button>
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="mt-3 flex flex-wrap gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-600" /> 선택 (클릭으로 추가/해제)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-red-300 bg-red-100" /> 차단됨 (클릭 → 해제)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-orange-300 bg-orange-100" /> 예약 확정
        </span>
      </div>
    </div>
  )
}
