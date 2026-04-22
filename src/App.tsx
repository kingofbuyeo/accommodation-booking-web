import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import AccommodationListPage   from './pages/AccommodationListPage'
import AccommodationDetailPage from './pages/AccommodationDetailPage'
import BookingPage             from './pages/BookingPage'
import BookingLookupPage       from './pages/BookingLookupPage'
import BookingDetailPage       from './pages/BookingDetailPage'
import HostDashboardPage       from './pages/host/HostDashboardPage'
import RegisterAccommodationPage from './pages/host/RegisterAccommodationPage'
import AddRoomPage             from './pages/host/AddRoomPage'
import BlockSchedulePage       from './pages/host/BlockSchedulePage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<AccommodationListPage />} />
            <Route path="accommodations/:id" element={<AccommodationDetailPage />} />
            <Route path="book/:accommodationId/:roomId" element={<BookingPage />} />
            <Route path="bookings" element={<BookingLookupPage />} />
            <Route path="bookings/:orderId" element={<BookingDetailPage />} />

            <Route path="host" element={<HostDashboardPage />} />
            <Route path="host/accommodations/new" element={<RegisterAccommodationPage />} />
            <Route path="host/accommodations/:accommodationId/rooms/new" element={<AddRoomPage />} />
            <Route path="host/accommodations/:accommodationId/rooms/:roomId/block" element={<BlockSchedulePage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
