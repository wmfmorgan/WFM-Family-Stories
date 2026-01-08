import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { events, families, familyMembers } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// GET /api/events - Get events for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const familyId = searchParams.get('familyId')

    const userEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        location: events.location,
        eventType: events.eventType,
        familyId: events.familyId,
        family: {
          name: families.name,
        },
        createdAt: events.createdAt,
      })
      .from(events)
      .innerJoin(families, eq(events.familyId, families.id))
      .innerJoin(familyMembers, eq(families.id, familyMembers.familyId))
      .where(
        familyId
          ? and(eq(familyMembers.userId, session.user.id), eq(events.familyId, familyId))
          : eq(familyMembers.userId, session.user.id)
      )
      .orderBy(desc(events.createdAt))
      .limit(limit > 0 ? limit : 10)

    return NextResponse.json(userEvents)
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, date, location, familyId, eventType, tags } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Event title is required' },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Event date is required' },
        { status: 400 }
      )
    }

    if (!familyId) {
      return NextResponse.json(
        { error: 'Family ID is required' },
        { status: 400 }
      )
    }

    // Check if user is a member of the family
    const familyMembership = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.familyId, familyId),
          eq(familyMembers.userId, session.user.id)
        )
      )
      .limit(1)

    if (familyMembership.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this family' },
        { status: 403 }
      )
    }

    // Create the event
    const [newEvent] = await db
      .insert(events)
      .values({
        title: title.trim(),
        description: description?.trim() || null,
        date: new Date(date),
        location: location?.trim() || null,
        familyId,
        createdById: session.user.id,
        eventType: eventType || 'other',
        tags: tags || [],
      })
      .returning()

    return NextResponse.json(newEvent, { status: 201 })
  } catch (error) {
    console.error('Failed to create event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
