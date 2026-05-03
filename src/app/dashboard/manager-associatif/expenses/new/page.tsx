import { ManagerExpenseForm } from './_components/ManagerExpenseForm'

export default function NewManagerExpensePage() {
  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Soumettre une dépense
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          La dépense sera visible par l&apos;admin du club
        </p>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        <ManagerExpenseForm />
      </div>
    </div>
  )
}
