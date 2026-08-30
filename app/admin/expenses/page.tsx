import { listExpenses } from "@/lib/expenses"
import { getViewYear } from "@/lib/years"
import ExpensesPageClient from "@/components/expenses-page-client"

export default async function ExpensesPage() {
  const year = await getViewYear()
  const expenses = await listExpenses({ year })

  return <ExpensesPageClient year={year} initialExpenses={expenses} />
}
