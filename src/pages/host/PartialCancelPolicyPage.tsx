import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, Info } from 'lucide-react'
import { accommodationApi } from '../../api/accommodation'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

const schema = z.object({
  enabled: z.boolean(),
  deadlineDaysBeforeCheckIn: z.coerce.number().min(0, '0 이상이어야 합니다').max(365),
  penaltyPercent: z.coerce.number().min(0, '0 이상이어야 합니다').max(100, '100 이하여야 합니다'),
})

type FormValues = z.infer<typeof schema>

export default function PartialCancelPolicyPage() {
  const { accommodationId, roomId } = useParams<{
    accommodationId: string
    roomId: string
  }>()
  const accId = Number(accommodationId)
  const rId = Number(roomId)
  const queryClient = useQueryClient()

  const { data: accommodation, isLoading } = useQuery({
    queryKey: ['accommodation', accId],
    queryFn: () => accommodationApi.getOne(accId),
    enabled: !isNaN(accId),
  })

  const room = accommodation?.rooms.find((r) => r.id === rId)
  const currentPolicy = room?.partialCancellationPolicy ?? null

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      enabled: false,
      deadlineDaysBeforeCheckIn: 7,
      penaltyPercent: 10,
    },
  })

  // 현재 정책 값으로 폼 초기화
  useEffect(() => {
    if (room !== undefined) {
      reset({
        enabled: currentPolicy?.enabled ?? false,
        deadlineDaysBeforeCheckIn: currentPolicy?.deadlineDaysBeforeCheckIn ?? 7,
        penaltyPercent: currentPolicy?.penaltyPercent ?? (currentPolicy
          ? Math.round((1 - currentPolicy.penaltyRatio) * 100)
          : 10),
      })
    }
  }, [room, reset])

  const enabled = useWatch({ control, name: 'enabled' })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      accommodationApi.updatePartialCancellationPolicy(
        accId,
        rId,
        values.enabled
          ? {
              enabled: true,
              deadlineDaysBeforeCheckIn: values.deadlineDaysBeforeCheckIn,
              penaltyRatio: (100 - values.penaltyPercent) / 100,
            }
          : null,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodation', accId] })
      queryClient.invalidateQueries({ queryKey: ['accommodations'] })
    },
  })

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-48 rounded bg-gray-200" /><div className="h-64 rounded-xl bg-gray-200" /></div>
  }

  if (!room) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-700">
        객실을 찾을 수 없습니다. (숙소 ID: {accId}, 객실 ID: {rId})
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          to="/host"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" /> 호스트 관리로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">부분취소 정책 설정</h1>
        <p className="mt-1 text-sm text-gray-500">
          {accommodation?.name} · {room.name}
        </p>
      </div>

      {/* 현재 정책 요약 */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">현재 정책</h2>
        {currentPolicy ? (
          <div className="space-y-1 text-sm">
            <StatusRow label="허용 여부" value="허용" positive />
            <StatusRow
              label="취소 가능 기간"
              value={`체크인 ${currentPolicy.deadlineDaysBeforeCheckIn}일 전까지`}
            />
            <StatusRow
              label="페널티"
              value={`${currentPolicy.penaltyPercent ?? Math.round((1 - currentPolicy.penaltyRatio) * 100)}% (환불 비율 ${Math.round(currentPolicy.penaltyRatio * 100)}%)`}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4 text-yellow-500" />
            현재 부분취소가 허용되지 않습니다. 아래에서 설정하세요.
          </div>
        )}
      </Card>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="mb-1 text-sm font-semibold text-gray-800">부분취소 허용</h2>
              <p className="mb-3 text-xs text-gray-500">
                고객이 예약 일정 중 일부 날짜(첫날 또는 마지막날 포함 연속 구간)를 취소할 수 있습니다.
              </p>
              <label className="flex cursor-pointer items-center gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    {...register('enabled')}
                  />
                  <div
                    className={`h-6 w-11 rounded-full transition-colors ${
                      enabled ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {enabled ? '허용' : '허용 안 함'}
                </span>
              </label>
            </div>

            {enabled && (
              <div className="space-y-4 rounded-lg bg-blue-50 p-4">
                <Input
                  label="취소 가능 기간 (체크인 N일 전까지)"
                  id="deadlineDaysBeforeCheckIn"
                  type="number"
                  min={0}
                  max={365}
                  error={errors.deadlineDaysBeforeCheckIn?.message}
                  {...register('deadlineDaysBeforeCheckIn')}
                />
                <div>
                  <Input
                    label="페널티 비율 (%)"
                    id="penaltyPercent"
                    type="number"
                    min={0}
                    max={100}
                    error={errors.penaltyPercent?.message}
                    {...register('penaltyPercent')}
                  />
                  <p className="mt-1 text-xs text-blue-600">
                    예: 10 입력 → 취소 금액의 10%가 수수료로 차감되고 90%가 환불됩니다.
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 text-xs text-gray-600">
                  <p className="font-medium text-gray-800 mb-1">정책 적용 기준</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>요청 시점의 정책이 적용됩니다 (예약 시점 기준 X)</li>
                    <li>정책 변경은 진행 중인 예약에 즉시 적용됩니다</li>
                    <li>체크인 시작 후에는 부분취소가 불가합니다</li>
                  </ul>
                </div>
              </div>
            )}

            {!enabled && (
              <div className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
                허용 안 함으로 저장하면 해당 객실의 기존 예약에서 부분취소 버튼이 숨겨집니다.
              </div>
            )}
          </div>
        </Card>

        {mutation.isError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {mutation.error instanceof Error ? mutation.error.message : '저장 중 오류가 발생했습니다.'}
          </p>
        )}

        {mutation.isSuccess && (
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            정책이 저장됐습니다.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={mutation.isPending}
          disabled={!isDirty && !mutation.isSuccess}
        >
          저장
        </Button>
      </form>
    </div>
  )
}

function StatusRow({
  label,
  value,
  positive,
}: {
  label: string
  value: string
  positive?: boolean
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={positive ? 'font-medium text-blue-600' : 'text-gray-900'}>{value}</span>
    </div>
  )
}
