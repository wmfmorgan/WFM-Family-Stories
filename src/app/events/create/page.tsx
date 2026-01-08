'use client'

import { useState, useEffect, lazy } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LazyWrapper } from '@/components/ui/lazy-wrapper'
import Link from 'next/link'

// Lazy load the CreateEventForm component
const CreateEventForm = lazy(() => import('@/components/forms/create-event-form').then(mod => ({ default: mod.CreateEventForm })))

interface Family {
  id: string
  name: string
  description: string | null
}

export default function CreateEvent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [families, setFamilies] = useState<Family[]>([])
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session) {
      fetchFamilies()
    }
  }, [status, session, router])

  useEffect(() => {
    const familyId = searchParams.get('familyId')
    if (familyId && families.length > 0) {
      setSelectedFamilyId(familyId)
    }
  }, [searchParams, families])

  const fetchFamilies = async () => {
    try {
      const response = await fetch('/api/families')
      if (response.ok) {
        const data = await response.json()
        setFamilies(data)
        if (data.length === 1) {
          setSelectedFamilyId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch families:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEventSubmit = async (data: {
    title: string
    description?: string
    date: string
    location?: string
  }) => {
    if (!selectedFamilyId) {
      throw new Error('Please select a family')
    }

    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        familyId: selectedFamilyId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create event')
    }

    const newEvent = await response.json()
    router.push(`/events/${newEvent.id}`)
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

  if (families.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-primary-600 hover:text-primary-500">
                  ← Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No families yet</h3>
              <p className="mt-1 text-sm text-gray-500">You need to create a family before you can create events.</p>
              <div className="mt-6">
                <Link href="/families/create">
                  <Button>Create Family First</Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
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
              <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-md mx-auto">
            {/* Family Selection */}
            {families.length > 1 && (
              <div className="bg-white py-6 px-6 shadow-lg rounded-lg mb-6">
                <label htmlFor="family" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Family *
                </label>
                <select
                  id="family"
                  value={selectedFamilyId}
                  onChange={(e) => setSelectedFamilyId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Choose a family...</option>
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Event Form */}
            <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
              <LazyWrapper>
                <CreateEventForm
                  familyId={selectedFamilyId}
                  onSubmit={handleEventSubmit}
                  onCancel={() => router.push('/dashboard')}
                />
              </LazyWrapper>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                Events are the memories and stories that make up your family's history.
                Add photos, descriptions, and details to preserve these special moments.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}