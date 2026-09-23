import { TestPlayer } from '@/components/student-portal/test-player/test-player'

export default function TestPlayerPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TestPlayer testId={params.id} />
    </div>
  )
}
