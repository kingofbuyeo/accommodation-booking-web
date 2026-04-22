import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft } from 'lucide-react'
import { accommodationApi } from '../../api/accommodation'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

const schema = z.object({
  roomName:                z.string().min(1, '객실명을 입력해주세요'),
  capacity:                z.coerce.number().min(1, '최소 1인 이상이어야 합니다'),
  pricePerNight:           z.coerce.number().min(1, '1박 요금을 입력해주세요'),
  shortLeadTimeDays:       z.coerce.number().min(1),
  shortLeadTimeTtlMinutes: z.coerce.number().min(1),
  longLeadTimeDays:        z.coerce.number().min(1),
  longLeadTimeTtlMinutes:  z.coerce.number().min(1),
  defaultTtlMinutes:       z.coerce.number().min(1),
})

type FormValues = z.infer<typeof schema>

export default function AddRoomPage() {
  const { accommodationId } = useParams<{ accommodationId: string }>()
  const accId = Number(accommodationId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      capacity: 2,
      shortLeadTimeDays: 3,
      shortLeadTimeTtlMinutes: 20,
      longLeadTimeDays: 30,
      longLeadTimeTtlMinutes: 120,
      defaultTtlMinutes: 60,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => accommodationApi.addRoom(accId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations'] })
      queryClient.invalidateQueries({ queryKey: ['accommodation', accId] })
      navigate('/host')
    },
  })

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link to="/host" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> 호스트 관리로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">객실 추가</h1>
        <p className="mt-1 text-sm text-gray-500">숙소 ID: {accId}</p>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Card>
          <div className="space-y-4">
            <Input label="객실명" id="roomName" placeholder="스탠다드 더블룸" error={errors.roomName?.message} {...register('roomName')} />
            <Input label="최대 인원" id="capacity" type="number" min={1} error={errors.capacity?.message} {...register('capacity')} />
            <Input
              label="1박 요금 (원)"
              id="pricePerNight"
              type="number"
              min={1}
              placeholder="150000"
              error={errors.pricePerNight?.message}
              {...register('pricePerNight')}
            />
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">선점 TTL 정책</h2>
            <p className="text-xs text-gray-500">이 객실의 결제 전 선점 유지 시간을 개별 설정합니다.</p>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="단기 기준 (일 이하)"
                id="shortLeadTimeDays"
                type="number"
                min={1}
                error={errors.shortLeadTimeDays?.message}
                {...register('shortLeadTimeDays')}
              />
              <Input
                label="단기 TTL (분)"
                id="shortLeadTimeTtlMinutes"
                type="number"
                min={1}
                error={errors.shortLeadTimeTtlMinutes?.message}
                {...register('shortLeadTimeTtlMinutes')}
              />
              <Input
                label="장기 기준 (일 이상)"
                id="longLeadTimeDays"
                type="number"
                min={1}
                error={errors.longLeadTimeDays?.message}
                {...register('longLeadTimeDays')}
              />
              <Input
                label="장기 TTL (분)"
                id="longLeadTimeTtlMinutes"
                type="number"
                min={1}
                error={errors.longLeadTimeTtlMinutes?.message}
                {...register('longLeadTimeTtlMinutes')}
              />
            </div>
            <Input
              label="기본 TTL (분)"
              id="defaultTtlMinutes"
              type="number"
              min={1}
              error={errors.defaultTtlMinutes?.message}
              {...register('defaultTtlMinutes')}
            />
          </div>
        </Card>

        {mutation.isError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {mutation.error instanceof Error ? mutation.error.message : '오류가 발생했습니다.'}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
          객실 추가
        </Button>
      </form>
    </div>
  )
}
