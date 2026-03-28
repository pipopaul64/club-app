import Link from 'next/link'
import { createEvent, listEventFormTeams } from '@/app/dashboard/events/actions'
import { EventForm } from '@/app/dashboard/events/_components/EventForm'

export default async function ManagerNewEventPage() {
  const teams = await listEventFormTeams()

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/calendar"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Retour au calendrier
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Nouvel événement
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          L&apos;événement sera créé pour votre équipe.
        </p>
      </div>

      {teams.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: '#f8f6fc', border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>
            Vous n&apos;êtes assigné à aucune équipe.
          </p>
          <p className="text-xs mt-1" style={{ color: '#cccad2' }}>
            Contactez un administrateur pour être assigné à une équipe.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <EventForm
            action={createEvent}
            teams={teams}
            requireTeam={true}
            submitLabel="Créer l'événement"
            cancelHref="/dashboard/calendar"
          />
        </div>
      )}
    </div>
  )
}
