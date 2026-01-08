'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Family {
  id: string
  name: string
  description: string | null
  createdAt: string
}

interface FamilyMember {
  id: string
  userId: string
  role: string
  joinedAt: string
  user: {
    name: string | null
    email: string
  }
}

interface Event {
  id: string
  title: string
  date: string
  location: string | null
  eventType: string
  createdAt: string
}

export default function FamilyDetail({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session) {
      fetchFamilyData()
    }
  }, [status, session, params.id, router])

  const fetchFamilyData = async () => {
    try {
      // Fetch family details
      const familyResponse = await fetch(`/api/families/${params.id}`)
      if (!familyResponse.ok) {
        if (familyResponse.status === 404) {
          setError('Family not found')
          return
        }
        throw new Error('Failed to fetch family')
      }
      const familyData = await familyResponse.json()
      setFamily(familyData)

      // Fetch family members
      const membersResponse = await fetch(`/api/families/${params.id}/members`)
      if (membersResponse.ok) {
        const membersData = await membersResponse.json()
        setMembers(membersData)
      }

      // Fetch family events
      const eventsResponse = await fetch(`/api/events?familyId=${params.id}`)
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData)
      }
    } catch (error) {
      console.error('Failed to fetch family data:', error)
      setError('Failed to load family data')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-primary-600 hover:text-primary-500">
                  ← Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Family Not Found</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <p className="text-red-600">{error}</p>
              <div className="mt-6">
                <Link href="/dashboard">
                  <Button>Back to Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!family) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-primary-600 hover:text-primary-500">
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{family.name}</h1>
                {family.description && (
                  <p className="text-gray-600 mt-1">{family.description}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Link href={`/events/create?familyId=${family.id}`}>
                <Button>Add Event</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Family Members */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Family Members ({members.length})
                  </h3>
                  {members.length > 0 ? (
                    <ul className="space-y-3">
                      {members.map((member) => (
                        <li key={member.id} className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium text-sm">
                                {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {member.user.name || member.user.email}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {member.role}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">No members yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Events */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Family Events ({events.length})
                    </h3>
                    <Link href={`/events/create?familyId=${family.id}`}>
                      <Button size="sm">Add Event</Button>
                    </Link>
                  </div>

                  {events.length > 0 ? (
                    <div className="space-y-4">
                      {events.map((event) => (
                        <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Link href={`/events/${event.id}`} className="block">
                                <h4 className="text-sm font-medium text-primary-600 hover:text-primary-500">
                                  {event.title}
                                </h4>
                                <div className="mt-1 text-sm text-gray-600">
                                  <span>{new Date(event.date).toLocaleDateString()}</span>
                                  {event.location && (
                                    <span className="ml-2">• {event.location}</span>
                                  )}
                                  <span className="ml-2 capitalize">• {event.eventType}</span>
                                </div>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No events yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Start documenting your family's memories.</p>
                      <div className="mt-6">
                        <Link href={`/events/create?familyId=${family.id}`}>
                          <Button>Create First Event</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}