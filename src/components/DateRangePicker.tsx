import { useState, useMemo } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  checkIn: string | null
  checkOut: string | null
  unavailableDates: Set<string>
  minCheckIn?: string
  onChange: (checkIn: string, checkOut: string) => void
}

export default function DateRangePicker({
  checkIn,
  checkOut,
  unavailableDates,
  minCheckIn,
  onChange,
}: Props) {
  const minDate = minCheckIn ? dayjs(minCheckIn) : dayjs().add(1, 'day')

  const ciDay = checkIn ? dayjs(checkIn) : null
  const coDay = checkOut ? dayjs(checkOut) : null

  const [viewDate, setViewDate] = useState(() =>
    (ciDay ?? minDate).startOf('month'),
  )
  const [hoverDate, setHoverDate] = useState<Dayjs | null>(null)

  // 체크인이 선택됐고 체크아웃은 아직 없는 상태
  const selectingCheckOut = !!(ciDay && !coDay)

  // 체크인 이후 첫 번째 예약불가 날짜 → 체크아웃 선택 상한선
  const firstBlockerAfterCheckIn = useMemo(() => {
    if (!ciDay) return null
    let nearest: Dayjs | null = null
    unavailableDates.forEach((ds) => {
      const d = dayjs(ds)
      if (d.isAfter(ciDay)) {
        if (!nearest || d.isBefore(nearest)) nearest = d
      }
    })
    return nearest
  }, [ciDay, unavailableDates])

  const isDisabled = (day: Dayjs): boolean => {
    if (day.isBefore(minDate)) return true
    if (unavailableDates.has(day.format('YYYY-MM-DD'))) return true
    if (selectingCheckOut && ciDay) {
      if (!day.isAfter(ciDay)) return true
      if (firstBlockerAfterCheckIn && !day.isBefore(firstBlockerAfterCheckIn)) return true
    }
    return false
  }

  const handleClick = (day: Dayjs) => {
    if (isDisabled(day)) return
    if (!ciDay || coDay) {
      // 체크인 (재)선택
      onChange(day.format('YYYY-MM-DD'), '')
    } else {
      // 체크아웃 선택
      onChange(ciDay.format('YYYY-MM-DD'), day.format('YYYY-MM-DD'))
    }
  }

  // 달력 셀 생성
  const startOfMonth = viewDate.startOf('month')
  const firstDow = startOfMonth.day() // 0=일
  const daysInMonth = viewDate.daysInMonth()
  const cells: (Dayjs | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(viewDate.date(d))
  while (cells.length % 7 !== 0) cells.push(null)

  // 호버 범위 끝점
  const hoverEnd =
    selectingCheckOut && ciDay && hoverDate && hoverDate.isAfter(ciDay) && !isDisabled(hoverDate)
      ? hoverDate
      : null

  const getCellClass = (day: Dayjs): string => {
    const ds = day.format('YYYY-MM-DD')
    const isUnavailable = unavailableDates.has(ds)
    const isPast = day.isBefore(minDate)
    const isBlockedByRange =
      selectingCheckOut && firstBlockerAfterCheckIn && !day.isBefore(firstBlockerAfterCheckIn)

    const isCI = ciDay?.isSame(day, 'day')
    const isCO = coDay?.isSame(day, 'day')
    const inRange = ciDay && coDay && day.isAfter(ciDay) && day.isBefore(coDay)
    const inHover = ciDay && hoverEnd && day.isAfter(ciDay) && day.isBefore(hoverEnd)

    const base = 'h-9 w-full flex items-center justify-center text-sm transition-colors'

    if (isCI || isCO)
      return `${base} bg-blue-600 text-white font-semibold rounded-lg cursor-pointer`
    if (inRange)
      return `${base} bg-blue-100 text-blue-800 cursor-pointer`
    if (inHover)
      return `${base} bg-blue-50 text-blue-600 cursor-pointer`
    if (isPast)
      return `${base} text-gray-300 cursor-not-allowed`
    if (isUnavailable || isBlockedByRange)
      return `${base} text-red-400 bg-red-50 line-through cursor-not-allowed`
    return `${base} text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer`
  }

  const prev = () => setViewDate((v) => v.subtract(1, 'month'))
  const next = () => setViewDate((v) => v.add(1, 'month'))

  return (
    <div className="w-full select-none">
      {/* 월 네비게이션 */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {viewDate.format('YYYY년 M월')}
        </span>
        <button
          type="button"
          onClick={next}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="mb-1 grid grid-cols-7">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div
            key={d}
            className="flex h-8 items-center justify-center text-xs font-medium text-gray-400"
          >
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
              onMouseEnter={() => setHoverDate(day)}
              onMouseLeave={() => setHoverDate(null)}
            >
              {day.date()}
            </div>
          ) : (
            <div key={`e${i}`} className="h-9" />
          ),
        )}
      </div>

      {/* 범례 */}
      <div className="mt-3 flex flex-wrap gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-600" /> 선택일
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-100" /> 선택 기간
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-100" /> 예약 불가
        </span>
      </div>
    </div>
  )
}
