import Link from 'next/link'
import React from 'react'

export default function Nav() {
  return (
    <div className="flex flex-wrap justify-between gap-3 px-4 py-3 text-sm md:text-base bg-green-600 text-white shadow">
        <Link href="/dashboard" className="hover:underline">Messages</Link>
        <Link href="/dashboard/aspirants" className="hover:underline">Voters</Link>
        <Link href="/dashboard/pollingStations" className="hover:underline">Polling stations</Link>
        <Link href="/dashboard/donations" className="hover:underline">Donations</Link>
        <Link href="/dashboard/team" className="hover:underline">Team</Link>
        <Link href="/dashboard/activities" className="hover:underline">Activities</Link>
        <Link href="/dashboard/expenses" className="hover:underline">Expenses</Link>
      </div>
  )
}

      


