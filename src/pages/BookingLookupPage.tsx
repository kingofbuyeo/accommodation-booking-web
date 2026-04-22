import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function BookingLookupPage() {
  const [orderId, setOrderId] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = Number(orderId.trim())
    if (!isNaN(id) && id > 0) navigate(`/bookings/${id}`)
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">예약 조회</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="예약 번호"
            id="orderId"
            type="number"
            min={1}
            placeholder="예약 번호를 입력하세요"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={!orderId.trim()}>
            <Search className="h-4 w-4" />
            조회하기
          </Button>
        </form>
      </Card>
    </div>
  )
}
