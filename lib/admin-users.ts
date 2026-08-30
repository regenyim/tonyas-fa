import "server-only"

// Maps admin usernames (admin_users.username column) to the paidTo value
// the reservation detail form should auto-fill when the admin changes status
// to one that allows payment. To change which admin maps to which person,
// update this map AND update the seeded admin_users rows accordingly
// (the username on the left must match what is stored in admin_users.username).
// Admins not in this map (e.g. office staff) get no auto-fill — they pick
// paidTo manually from the dropdown.
const USERNAME_TO_PAID_TO: Record<string, "Sanyi" | "János"> = {
  Sanyi: "Sanyi",
  Janos: "János",
}

export function paidToForUsername(username: string | null): "Sanyi" | "János" | null {
  if (!username) return null
  return USERNAME_TO_PAID_TO[username] ?? null
}
