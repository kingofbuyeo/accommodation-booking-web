import { useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, CalendarX } from 'lucide-react'
import dayjs from 'dayjs'
import { accommodationApi } from '../api/accommodation'
import { bookingApi } from '../api/booking'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import DateRangePicker from '../components/DateRangePicker'

const schema = z
  .object({
    checkIn:   z.string().min(1, '체크인 날짜를 선택해주세요'),
    checkOut:  z.string().min(1, '체크아웃 날짜를 선택해주세요'),
    guestName: z.string().min(1, '이름을 입력해주세요'),
    phone:     z.string().min(9, '연락처를 입력해주세요'),
    headcount: z.coerce.number().min(1, '인원은 1명 이상이어야 합니다'),
  })
  .refine((d) => dayjs(d.checkOut).isAfter(dayjs(d.checkIn)), {
    message: '체크아웃은 체크인보다 늦어야 합니다',
    path: ['checkOut'],
  })

type FormValues = z.infer<typeof schema>

export default function BookingPage() {
  const { accommodationId, roomId } = useParams<{ accommodationId: string; roomId: string }>()
  const navigate = useNavigate()
  const accId = Number(accommodationId)
  const rmId  = Number(roomId)

  const { data: accommodation } = useQuery({
    queryKey: ['accommodation', accId],
    queryFn: () => accommodationApi.getOne(accId),
    enabled: !isNaN(accId),
    staleTime: 0, // 예약 불가 날짜는 항상 최신 데이터를 사용해야 함
  })

  const room = accommodation?.rooms.find((r) => r.id === rmId)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { headcount: 1 },
  })

  const checkIn  = watch('checkIn')  ?? null
  const checkOut = watch('checkOut') ?? null

  // 예약 불가 날짜 집합 (호스트 차단 + 확정 예약)
  const unavailableDates = useMemo(() => {
    const s = new Set<string>()
    if (!room) return s
    room.blockedDates.forEach((b) => s.add(b.date))
    room.bookedDates.forEach((d) => s.add(d))
    return s
  }, [room])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      bookingApi.placeOrder({ accommodationId: accId, roomId: rmId, ...values }),
    onSuccess: (order) => navigate(`/bookings/${order.orderId}`),
  })

  const nights = checkIn && checkOut ? dayjs(checkOut).diff(dayjs(checkIn), 'day') : 0
  const total  = room ? nights * room.pricePerNight : 0

  const selectionStatus = () => {
    if (!checkIn) return { text: '체크인 날짜를 선택해주세요', color: 'text-gray-500' }
    if (!checkOut) return { text: '체크아웃 날짜를 선택해주세요', color: 'text-blue-600' }
    return {
      text: `${dayjs(checkIn).format('M/D')} → ${dayjs(checkOut).format('M/D')} (${nights}박)`,
      color: 'text-blue-700 font-semibold',
    }
  }

  const status = selectionStatus()

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          to={`/accommodations/${accId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" /> 숙소로 돌아가기
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">예약하기</h1>
        {accommodation && room && (
          <p className="mt-1 text-sm text-gray-500">
            {accommodation.name} · {room.name}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        {/* 달력 */}
        <Card>
          <h2 className="mb-1 font-semibold text-gray-800">투숙 기간</h2>

          {/* 선택 상태 안내 */}
          <p className={`mb-4 text-sm ${status.color}`}>{status.text}</p>

          {/* 예약 불가 날짜가 없으면 안내 없음, 있으면 수 표시 */}
          {unavailableDates.size > 0 && (
            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <CalendarX className="h-3.5 w-3.5 flex-shrink-0" />
              <span>이 객실은 예약 불가 날짜가 {unavailableDates.size}일 있습니다. 빨간 날짜는 선택할 수 없습니다.</span>
            </div>
          )}

          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            unavailableDates={unavailableDates}
            minCheckIn={dayjs().add(1, 'day').format('YYYY-MM-DD')}
            onChange={(ci, co) => {
              setValue('checkIn', ci, { shouldValidate: !!ci })
              setValue('checkOut', co, { shouldValidate: !!co })
            }}
          />

          {/* 숨김 필드 — react-hook-form 등록용 */}
          <input type="hidden" {...register('checkIn')} />
          <input type="hidden" {...register('checkOut')} />

          {(errors.checkIn || errors.checkOut) && (
            <p className="mt-2 text-xs text-red-600">
              {errors.checkIn?.message ?? errors.checkOut?.message}
            </p>
          )}

          <div className="mt-4">
            <Input
              label="인원수"
              type="number"
              id="headcount"
              min={1}
              max={room?.capacity ?? 10}
              error={errors.headcount?.message}
              {...register('headcount')}
            />
          </div>
        </Card>

        {/* 예약자 정보 */}
        <Card>
          <h2 className="mb-4 font-semibold text-gray-800">예약자 정보</h2>
          <div className="space-y-4">
            <Input
              label="이름"
              id="guestName"
              placeholder="홍길동"
              error={errors.guestName?.message}
              {...register('guestName')}
            />
            <Input
              label="연락처"
              id="phone"
              type="tel"
              placeholder="01012345678"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>
        </Card>

        {/* 예약 요약 */}
        {room && nights > 0 && (
          <Card>
            <h2 className="mb-3 font-semibold text-gray-800">예약 요약</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{room.pricePerNight.toLocaleString()}원 × {nights}박</span>
                <span>{total.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900">
                <span>합계</span>
                <span className="text-blue-600">{total.toLocaleString()}원</span>
              </div>
            </div>
          </Card>
        )}

        {mutation.isError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {mutation.error instanceof Error ? mutation.error.message : '예약 중 오류가 발생했습니다.'}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
          예약 요청하기
        </Button>
      </form>
    </div>
  )
}
