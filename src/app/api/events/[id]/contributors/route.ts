import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { eventContributors, events, familyMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

// Schema for event contributor
const EventContributorSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['owner', 'editor', 'viewer']).default('editor'),
  canEdit: z.boolean().default(true),
  canDelete: z.boolean().default(false),
  canInvite: z.boolean().default(false),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id

    // Check if user has access to this event
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user is a member of the family
    const familyMembership = await db.query.familyMembers.findFirst({
      where: and(
        eq(familyMembers.familyId, event.familyId),
        eq(familyMembers.userId, session.user.id)
      )
    })

    if (!familyMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all contributors for this event
    const contributors = await db.query.eventContributors.findMany({
      where: eq(eventContributors.eventId, eventId),
      with: {
        user: true,
        addedBy: true
      }
    })

    return NextResponse.json(contributors)
  } catch (error) {
    console.error('Error fetching event contributors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const body = await request.json()

    // Validate input
    const validation = EventContributorSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }

    const { userId, role, canEdit, canDelete, canInvite } = validation.data

    // Check if user has access to this event
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user is a member of the family
    const familyMembership = await db.query.familyMembers.findFirst({
      where: and(
        eq(familyMembers.familyId, event.familyId),
        eq(familyMembers.userId, session.user.id)
      )
    })

    if (!familyMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if current user has permission to invite others
    let hasPermission = event.createdById === session.user.id

    // Check if current user is a contributor with invite permissions
    if (!hasPermission) {
      const userContributor = await db.query.eventContributors.findFirst({
        where: and(
          eq(eventContributors.eventId, eventId),
          eq(eventContributors.userId, session.user.id),
          eq(eventContributors.canInvite, true)
        )
      })
      hasPermission = !!userContributor
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check if user is already a contributor
    const existingContributor = await db.query.eventContributors.findFirst({
      where: and(
        eq(eventContributors.eventId, eventId),
        eq(eventContributors.userId, userId)
      )
    })

    if (existingContributor) {
      return NextResponse.json({ error: 'User is already a contributor' }, { status: 409 })
    }

    // Add new contributor
    const newContributor = await db.insert(eventContributors).values({
      eventId,
      userId,
      role,
      addedById: session.user.id,
      canEdit,
      canDelete,
      canInvite,
    }).returning()

    return NextResponse.json(newContributor[0], { status: 201 })
  } catch (error) {
    console.error('Error adding event contributor:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const { userId } = await request.json()

    // Check if user has access to this event
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user is a member of the family
    const familyMembership = await db.query.familyMembers.findFirst({
      where: and(
        eq(familyMembers.familyId, event.familyId),
        eq(familyMembers.userId, session.user.id)
      )
    })

    if (!familyMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if current user has permission to remove others
    let hasPermission = event.createdById === session.user.id

    // Check if current user is a contributor with invite permissions
    if (!hasPermission) {
      const userContributor = await db.query.eventContributors.findFirst({
        where: and(
          eq(eventContributors.eventId, eventId),
          eq(eventContributors.userId, session.user.id),
          eq(eventContributors.canInvite, true)
        )
      })
      hasPermission = !!userContributor
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Cannot remove event creator
    if (event.createdById === userId) {
      return NextResponse.json({ error: 'Cannot remove event creator' }, { status: 400 })
    }

    // Remove contributor
    await db.delete(eventContributors).where(and(
      eq(eventContributors.eventId, eventId),
      eq(eventContributors.userId, userId)
    ))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing event contributor:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}