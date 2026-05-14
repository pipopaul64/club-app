import Link from 'next/link'
import { createEvent } from '@/app/dashboard/events/actions'
import { EventForm } from '@/app/dashboard/events/_components/EventForm'

export default function AdminNewEventPage() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/admin/events"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Retour aux événements
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Nouvel événement
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          Cet événement sera ouvert à <strong>tout le club</strong>. Pour un
          évènement réservé à une équipe, passez par <em>Mon équipe › Calendrier</em>.
        </p>
      </div>

      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        <EventForm
          action={createEvent}
          teams={[]}
          hideTeamField
          submitLabel="Créer l'événement"
          cancelHref="/dashboard/admin/events"
          redirectTo="/dashboard/admin/events"
        />
      </div>
    </div>
  )
}
