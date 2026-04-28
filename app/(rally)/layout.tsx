import { EmergencyFooter } from '@/components/anjin'

export default function RallyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-rally-bg" style={{ background: '#f5f3ed' }}>
      <main className="max-w-lg mx-auto">
        {children}
      </main>
    </div>
  )
}
