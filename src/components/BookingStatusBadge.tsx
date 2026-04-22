import type { BookingStatus } from '../types/booking'

const config: Record<BookingStatus, { label: string; className: string }> = {
  REQUESTED:  { label: '예약 요청됨',   className: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED:  { label: '예약 확정됨',   className: 'bg-green-100  text-green-800'  },
  CHECKED_IN: { label: '체크인 완료',   className: 'bg-blue-100   text-blue-800'   },
  CHECKED_OUT:{ label: '체크아웃 완료', className: 'bg-gray-100   text-gray-700'   },
  CANCELLED:  { label: '취소됨',        className: 'bg-red-100    text-red-700'    },
  EXPIRED:    { label: '만료됨',        className: 'bg-orange-100 text-orange-700' },
}

export default function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
