import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { events, families, familyMembers, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET /api/events/[id] - Get a single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        location: events.location,
        eventType: events.eventType,
        familyId: events.familyId,
        createdById: events.createdById,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        family: {
          name: families.name,
        },
        creator: {
          name: users.name,
          email: users.email,
        },
      })
      .from(events)
      .innerJoin(families, eq(events.familyId, families.id))
      .innerJoin(users, eq(events.createdById, users.id))
      .innerJoin(familyMembers, eq(families.id, familyMembers.familyId))
      .where(
        and(
          eq(events.id, params.id),
          eq(familyMembers.userId, session.user.id)
        )
      )
      .limit(1)

    if (event.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event[0])
  } catch (error) {
    console.error('Failed to fetch event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/events/[id] - Update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, date, location, eventType, tags } = body

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

    // Check if user has permission to update this event
    const existingEvent = await db
      .select()
      .from(events)
      .innerJoin(families, eq(events.familyId, families.id))
      .innerJoin(familyMembers, eq(families.id, familyMembers.familyId))
      .where(
        and(
          eq(events.id, params.id),
          eq(familyMembers.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingEvent.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Only allow the creator or family admins to update
    const userRole = await db
      .select({ role: familyMembers.role })
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.familyId, existingEvent[0].families.id),
          eq(familyMembers.userId, session.user.id)
        )
      )
      .limit(1)

    if (
      existingEvent[0].events.createdById !== session.user.id &&
      userRole[0]?.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to update this event' },
        { status: 403 }
      )
    }

    // Update the event
    const [updatedEvent] = await db
      .update(events)
      .set({
        title: title.trim(),
        description: description?.trim() || null,
        date: new Date(date),
        location: location?.trim() || null,
        eventType: eventType || 'other',
        tags: tags || [],
        updatedAt: new Date(),
      })
      .where(eq(events.id, params.id))
      .returning()

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error('Failed to update event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete this event
    const existingEvent = await db
      .select()
      .from(events)
      .innerJoin(families, eq(events.familyId, families.id))
      .innerJoin(familyMembers, eq(families.id, familyMembers.familyId))
      .where(
        and(
          eq(events.id, params.id),
          eq(familyMembers.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingEvent.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Only allow the creator or family admins to delete
    const userRole = await db
      .select({ role: familyMembers.role })
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.familyId, existingEvent[0].families.id),
          eq(familyMembers.userId, session.user.id)
        )
      )
      .limit(1)

    if (
      existingEvent[0].events.createdById !== session.user.id &&
      userRole[0]?.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this event' },
        { status: 403 }
      )
    }

    // Delete the event
    await db.delete(events).where(eq(events.id, params.id))

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Failed to delete event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}