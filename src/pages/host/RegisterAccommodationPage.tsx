import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft } from 'lucide-react'
import { accommodationApi } from '../../api/accommodation'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

const schema = z.object({
  name:                    z.string().min(1, '숙소명을 입력해주세요'),
  address:                 z.string().min(1, '주소를 입력해주세요'),
  description:             z.string().optional(),
  hostName:                z.string().min(1, '호스트명을 입력해주세요'),
  shortLeadTimeDays:       z.coerce.number().min(1),
  shortLeadTimeTtlMinutes: z.coerce.number().min(1),
  longLeadTimeDays:        z.coerce.number().min(1),
  longLeadTimeTtlMinutes:  z.coerce.number().min(1),
  defaultTtlMinutes:       z.coerce.number().min(1),
})

type FormValues = z.infer<typeof schema>

export default function RegisterAccommodationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      shortLeadTimeDays: 3,
      shortLeadTimeTtlMinutes: 20,
      longLeadTimeDays: 30,
      longLeadTimeTtlMinutes: 120,
      defaultTtlMinutes: 60,
    },
  })

  const mutation = useMutation({
    mutationFn: accommodationApi.register,
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['accommodations'] })
      navigate(`/host/accommodations/${id}/rooms/new`)
    },
  })

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link to="/host" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> 호스트 관리로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">숙소 등록</h1>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Card>
          <div className="space-y-4">
            <Input label="숙소명" id="name" placeholder="편안한 호텔" error={errors.name?.message} {...register('name')} />
            <Input label="주소" id="address" placeholder="서울시 강남구..." error={errors.address?.message} {...register('address')} />
            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">설명 (선택)</label>
              <textarea
                id="description"
                rows={3}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="숙소 소개..."
                {...register('description')}
              />
            </div>
            <Input label="호스트명" id="hostName" placeholder="김호스트" error={errors.hostName?.message} {...register('hostName')} />
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">선점 TTL 정책</h2>
            <p className="text-xs text-gray-500">결제 전 일정 선점 유지 시간을 설정합니다. 체크인이 가까울수록 TTL을 짧게 설정해 공실 손실을 줄일 수 있습니다.</p>

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
            {mutation.error instanceof Error ? mutation.error.message : '등록 중 오류가 발생했습니다.'}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
          숙소 등록
        </Button>
      </form>
    </div>
  )
}
