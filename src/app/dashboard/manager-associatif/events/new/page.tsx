import Link from 'next/link'
import { createEvent, listEventFormTeams } from '@/app/dashboard/events/actions'
import { EventForm } from '@/app/dashboard/events/_components/EventForm'

export default async function ManagerAssociatifNewEventPage() {
  const teams = await listEventFormTeams()

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/manager-associatif/events"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Retour aux événements
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Nouvel événement
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          Créer un événement associatif avec gestion de bénévoles.
        </p>
      </div>

      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        <EventForm
          action={createEvent}
          teams={teams}
          requireTeam={false}
          submitLabel="Créer l'événement"
          cancelHref="/dashboard/manager-associatif/events"
          redirectTo="/dashboard/manager-associatif/events"
        />
      </div>
    </div>
  )
}
