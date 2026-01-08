import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { eventPrivacy, events, familyMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

// Schema for privacy settings
const PrivacySettingsSchema = z.object({
  userId: z.string().uuid(),
  canView: z.boolean().default(true),
  canEdit: z.boolean().default(false),
  canComment: z.boolean().default(true),
  canUploadMedia: z.boolean().default(true),
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

    // Get all privacy settings for this event
    const privacySettings = await db.query.eventPrivacy.findMany({
      where: eq(eventPrivacy.eventId, eventId),
      with: {
        user: true
      }
    })

    return NextResponse.json(privacySettings)
  } catch (error) {
    console.error('Error fetching event privacy settings:', error)
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
    const validation = PrivacySettingsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }

    const { userId, canView, canEdit, canComment, canUploadMedia } = validation.data

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

    // Check if current user has permission to manage privacy settings
    const hasPermission = event.createdById === session.user.id

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check if privacy settings already exist for this user
    const existingSettings = await db.query.eventPrivacy.findFirst({
      where: and(
        eq(eventPrivacy.eventId, eventId),
        eq(eventPrivacy.userId, userId)
      )
    })

    if (existingSettings) {
      // Update existing settings
      const updatedSettings = await db.update(eventPrivacy).set({
        canView,
        canEdit,
        canComment,
        canUploadMedia,
      }).where(eq(eventPrivacy.id, existingSettings.id)).returning()

      return NextResponse.json(updatedSettings[0])
    } else {
      // Add new privacy settings
      const newSettings = await db.insert(eventPrivacy).values({
        eventId,
        userId,
        canView,
        canEdit,
        canComment,
        canUploadMedia,
      }).returning()

      return NextResponse.json(newSettings[0], { status: 201 })
    }
  } catch (error) {
    console.error('Error updating privacy settings:', error)
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

    // Check if current user has permission to manage privacy settings
    const hasPermission = event.createdById === session.user.id

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check if privacy settings exist
    const existingSettings = await db.query.eventPrivacy.findFirst({
      where: and(
        eq(eventPrivacy.eventId, eventId),
        eq(eventPrivacy.userId, userId)
      )
    })

    if (!existingSettings) {
      return NextResponse.json({ error: 'Privacy settings not found' }, { status: 404 })
    }

    // Delete privacy settings
    await db.delete(eventPrivacy).where(eq(eventPrivacy.id, existingSettings.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting privacy settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}