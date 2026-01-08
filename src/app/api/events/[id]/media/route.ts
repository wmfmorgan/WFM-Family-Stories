import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { media, events, familyMembers, eventContributors } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

// Schema for media upload
const MediaUploadSchema = z.object({
  filename: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().positive(),
  url: z.string().url().optional(),
  altText: z.string().optional(),
  isPublic: z.boolean().default(false),
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

    // Get all media for this event
    const eventMedia = await db.query.media.findMany({
      where: eq(media.eventId, eventId),
      with: {
        uploader: true
      }
    })

    return NextResponse.json(eventMedia)
  } catch (error) {
    console.error('Error fetching event media:', error)
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
    const validation = MediaUploadSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }

    const { filename, originalName, mimeType, size, url, altText, isPublic } = validation.data

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

    // Check if user has permission to upload media
    let hasPermission = event.createdById === session.user.id

    // Check if current user is a contributor with media upload permissions
    if (!hasPermission) {
      const userContributor = await db.query.eventContributors.findFirst({
        where: and(
          eq(eventContributors.eventId, eventId),
          eq(eventContributors.userId, session.user.id)
        )
      })
      hasPermission = !!userContributor
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Add new media
    const newMedia = await db.insert(media).values({
      eventId,
      uploadedById: session.user.id,
      filename,
      originalName,
      mimeType,
      size,
      url,
      altText,
      isPublic,
    }).returning()

    return NextResponse.json(newMedia[0], { status: 201 })
  } catch (error) {
    console.error('Error uploading media:', error)
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
    const { mediaId } = await request.json()

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

    // Check if user has permission to delete media
    let hasPermission = event.createdById === session.user.id

    // Check if current user is a contributor with delete permissions
    if (!hasPermission) {
      const userContributor = await db.query.eventContributors.findFirst({
        where: and(
          eq(eventContributors.eventId, eventId),
          eq(eventContributors.userId, session.user.id),
          eq(eventContributors.canDelete, true)
        )
      })
      hasPermission = !!userContributor
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check if media exists and belongs to this event
    const existingMedia = await db.query.media.findFirst({
      where: and(
        eq(media.id, mediaId),
        eq(media.eventId, eventId)
      )
    })

    if (!existingMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Delete media
    await db.delete(media).where(eq(media.id, mediaId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}