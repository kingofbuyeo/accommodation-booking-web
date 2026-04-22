import { useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { Clock, AlertTriangle } from 'lucide-react'

interface Props {
  expiresAt: string
  onExpired?: () => void
}

export default function ExpiryCountdown({ expiresAt, onExpired }: Props) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, dayjs(expiresAt).diff(dayjs(), 'second')),
  )
  // ref로 최신 콜백 유지 — effect 재실행 없이 항상 최신 onExpired 호출
  const onExpiredRef = useRef(onExpired)
  onExpiredRef.current = onExpired

  useEffect(() => {
    const calc = () => Math.max(0, dayjs(expiresAt).diff(dayjs(), 'second'))

    setRemaining(calc())

    const id = setInterval(() => {
      const secs = calc()
      setRemaining(secs)
      if (secs === 0) {
        clearInterval(id)
        onExpiredRef.current?.()
      }
    }, 1000)

    return () => clearInterval(id)
  }, [expiresAt])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  const isUrgent  = remaining > 0 && remaining <= 300  // 5분 미만
  const isExpired = remaining === 0

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-gray-500">
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-medium">예약 선점 시간이 만료되었습니다.</span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 ${
        isUrgent
          ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
          : 'bg-blue-50 text-blue-700'
      }`}
    >
      <div className="flex items-center gap-2">
        {isUrgent ? (
          <AlertTriangle className="h-4 w-4 flex-shrink-0 animate-pulse" />
        ) : (
          <Clock className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="text-sm font-medium">
          {isUrgent ? '결제 마감이 임박했습니다!' : '결제 마감까지 남은 시간'}
        </span>
      </div>
      <span
        className={`font-mono text-xl font-bold tabular-nums ${
          isUrgent ? 'text-red-600' : 'text-blue-600'
        }`}
      >
        {mm}:{ss}
      </span>
    </div>
  )
}
