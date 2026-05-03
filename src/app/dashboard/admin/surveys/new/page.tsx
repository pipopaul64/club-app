import Link from 'next/link'
import { SurveyForm } from './_components/SurveyForm'

export default function NewSurveyPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/admin/surveys"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Sondages
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Nouveau sondage
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          Les licenciés du club pourront répondre Oui ou Non.
        </p>
      </div>

      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        <SurveyForm />
      </div>
    </div>
  )
}
