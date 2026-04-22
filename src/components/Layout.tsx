import { Link, useLocation, Outlet } from 'react-router-dom'
import { Hotel, CalendarCheck, Settings } from 'lucide-react'

const navLinks = [
  { to: '/',     label: '숙소 검색', icon: Hotel },
  { to: '/bookings', label: '예약 조회', icon: CalendarCheck },
  { to: '/host', label: '호스트',     icon: Settings },
]

export default function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-blue-600">
            <Hotel className="h-6 w-6" />
            <span className="text-lg font-bold tracking-tight">숙박 예약</span>
          </Link>
          <nav className="flex gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
        © 2025 숙박 예약 서비스
      </footer>
    </div>
  )
}
