import { Header } from '@/components/layout/Header'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-rally-beige">
      <Header variant="dark" />
      <main>{children}</main>
    </div>
  )
}
