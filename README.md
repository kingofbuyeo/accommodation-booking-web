# accommodation-booking-web

숙박 예약 시스템의 프론트엔드 서비스. DDD Gym Week1/Week2 실습을 통해 설계하고 구현한 결과물.

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| Framework | React 18 |
| Language | TypeScript 5.6 |
| Build Tool | Vite 8 |
| Routing | React Router DOM 6 |
| Server State | TanStack Query (React Query) 5 |
| Form | React Hook Form 7 + Zod 3 |
| HTTP Client | Axios 1.7 |
| 날짜 처리 | Day.js 1.11 |
| UI 아이콘 | lucide-react |
| 스타일 | Tailwind CSS 3 |

---

## 실행 방법

```bash
# Node.js 20 권장
nvm use 20

npm install
npm run dev
```

기본 포트: `http://localhost:5173`

백엔드(`accommodation-booking-service`)가 `http://localhost:8080`에서 실행 중이어야 한다.  
Vite dev 서버의 프록시 설정으로 `/api/v1/*` 요청이 백엔드로 전달된다.

---

## 페이지 구조 및 라우팅

```
/                                          → AccommodationListPage     (숙소 목록)
/accommodations/:id                        → AccommodationDetailPage   (숙소 상세 + 객실 목록)
/book/:accommodationId/:roomId             → BookingPage               (예약 신청)
/bookings                                  → BookingLookupPage         (예약 조회)
/bookings/:orderId                         → BookingDetailPage         (예약 상세 + 결제 확정)

/host                                      → HostDashboardPage         (호스트 관리)
/host/accommodations/new                   → RegisterAccommodationPage (숙소 등록)
/host/accommodations/:id/rooms/new         → AddRoomPage               (객실 추가)
/host/accommodations/:id/rooms/:id/block   → BlockSchedulePage         (예약 불가 일정 설정)
```

---

## 주요 컴포넌트

### DateRangePicker

체크인/체크아웃 날짜를 달력 UI로 선택하는 컴포넌트.

- 이미 예약된 날짜(`bookedDates`)와 차단된 날짜(`blockedDates`)는 선택 불가
- 체크인 선택 후 체크아웃을 선택하면 자동으로 범위를 표시
- 과거 날짜와 당일은 선택 불가

### HostCalendar

호스트 전용 달력. 예약 불가 일정 설정 페이지에서 사용.

- 차단된 날짜(빨간색)를 클릭하면 인라인 해제 확인 UI 표시
- 예약된 날짜(주황색)는 클릭 불가
- 미선택 날짜를 클릭하면 `selectedDates(Set<string>)`에 토글
- 선택된 날짜가 1개 이상이면 "N일 선택됨 / 전체 해제" 배너 표시
- 달력 하단 범례 표시

### ExpiryCountdown

REQUESTED 상태 예약의 선점 만료 카운트다운.

- `expiresAt` ISO 문자열을 받아 남은 초를 1초 간격으로 계산
- 5분(300초) 미만이면 빨간색 + AlertTriangle 아이콘 + 애니메이션 경고
- 만료 시 "예약 선점 시간이 만료되었습니다." 메시지로 전환
- `onExpired` 콜백으로 부모에 만료 알림 (stale closure 방지를 위해 `useRef` 패턴 사용)

### BookingStatusBadge

예약 상태를 색상 배지로 표시.

| 상태 | 색상 |
|------|------|
| REQUESTED | 노란색 |
| CONFIRMED | 초록색 |
| CHECKED_IN | 파란색 |
| CHECKED_OUT | 회색 |
| CANCELLED | 빨간색 |
| EXPIRED | 회색 |

---

## 페이지별 주요 기능

### AccommodationListPage

숙소 카드 목록. 클릭하면 AccommodationDetailPage로 이동.

### AccommodationDetailPage

숙소 상세 정보와 객실 목록 표시.  
각 객실 카드에서 "예약하기" 버튼으로 BookingPage 이동.  
예약 건수/차단 건수 등 내부 통계는 **고객에게 노출하지 않는다** (호스트 전용 정보).

### BookingPage

DateRangePicker로 날짜를 선택하고 예약자 이름을 입력해 예약 신청.  
- accommodation 쿼리에 `staleTime: 0` 설정 → 예약된 날짜를 항상 최신 상태로 조회
- 예약 성공 시 BookingDetailPage로 자동 이동

### BookingDetailPage

예약 상세 및 액션 패널.

- REQUESTED 상태 + `expiresAt` 존재 시 ExpiryCountdown 표시
- 결제 확정(confirm) / 취소(cancel) 후 accommodation 캐시도 함께 무효화 → 달력에 즉시 반영
- 상태별 액션:
  - REQUESTED: 결제 확정 / 예약 취소
  - CONFIRMED: 체크인 / 예약 취소
  - CHECKED_IN: 체크아웃
  - CHECKED_OUT / EXPIRED: 액션 없음

### BlockSchedulePage (호스트)

객실별 예약 불가 일정 설정.

- HostCalendar로 복수 날짜 선택
- 차단 유형(BLOCKED / MAINTENANCE / OWNER_USE)과 사유를 입력 후 일괄 차단
- 단건 해제: 달력 또는 하단 목록에서 "해제" 클릭
- 일괄 차단: 선택한 N개 날짜를 단일 API 호출(`POST .../block/bulk`)로 처리

---

## 상태 관리 전략

### TanStack Query 설정

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,   // 기본 30초 캐시
    },
  },
})
```

예약 정확성이 중요한 페이지(BookingPage, BlockSchedulePage)는 쿼리 단위로 `staleTime: 0` 오버라이드.

### 캐시 무효화 패턴

결제 확정 / 취소 후 예약된 날짜가 달력에 즉시 반영되도록 관련 캐시를 모두 무효화:

```ts
const invalidateWithAccommodation = () => {
  queryClient.invalidateQueries({ queryKey: ['booking', id] })
  queryClient.invalidateQueries({ queryKey: ['accommodation'] })
  queryClient.invalidateQueries({ queryKey: ['accommodations'] })
}
```

### 폴링

BookingDetailPage에서 REQUESTED / CONFIRMED 상태일 때 5초 간격으로 자동 갱신:

```ts
refetchInterval: (query) => {
  const status = query.state.data?.status
  return status === 'REQUESTED' || status === 'CONFIRMED' ? 5_000 : false
}
```

---

## API 통신 레이어

### HTTP 클라이언트 (`src/api/client.ts`)

- baseURL: `/api/v1`
- timeout: 10초
- 에러 인터셉터: `error.response.data.message` → `Error` 객체로 정규화

### API 모듈

| 파일 | 담당 |
|------|------|
| `src/api/accommodation.ts` | 숙소/객실 CRUD, 일정 차단/해제/일괄차단 |
| `src/api/booking.ts` | 예약 생성, 조회, 확정, 취소, 체크인/아웃 |

---

## 폼 검증 (React Hook Form + Zod)

모든 폼은 `zodResolver`로 스키마 검증:

```ts
const schema = z.object({
  guestName: z.string().min(1, '예약자 이름을 입력하세요'),
  checkIn:   z.string().min(1, '체크인 날짜를 선택하세요'),
  checkOut:  z.string().min(1, '체크아웃 날짜를 선택하세요'),
})
```

---

## 호스트 / 고객 뷰 분리

고객 화면과 호스트 화면은 별도 경로(`/host/*`)로 분리한다.

- 고객은 예약 건수, 차단 건수 등 운영 통계를 볼 수 없다
- 호스트 대시보드에서만 객실별 일정 관리(BlockSchedulePage) 접근 가능
- 실제 인증/인가는 구현하지 않았으며, 경로 구분으로만 역할을 분리한다
