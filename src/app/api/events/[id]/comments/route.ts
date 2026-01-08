import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { comments, events, familyMembers, eventContributors } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

// Schema for comment
const CommentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional(),
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

    // Get all comments for this event
    const eventComments = await db.query.comments.findMany({
      where: eq(comments.eventId, eventId),
      with: {
        author: true,
        replies: {
          with: {
            author: true
          }
        }
      }
    })

    return NextResponse.json(eventComments)
  } catch (error) {
    console.error('Error fetching event comments:', error)
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
    const validation = CommentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }

    const { content, parentId } = validation.data

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

    // Check if user has permission to comment
    let hasPermission = event.createdById === session.user.id

    // Check if current user is a contributor with comment permissions
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

    // Add new comment
    const newComment = await db.insert(comments).values({
      eventId,
      authorId: session.user.id,
      content,
      parentId,
    }).returning()

    return NextResponse.json(newComment[0], { status: 201 })
  } catch (error) {
    console.error('Error adding comment:', error)
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
    const { commentId } = await request.json()

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

    // Check if comment exists and belongs to this event
    const existingComment = await db.query.comments.findFirst({
      where: and(
        eq(comments.id, commentId),
        eq(comments.eventId, eventId)
      )
    })

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user has permission to delete this comment
    const canDelete = existingComment.authorId === session.user.id ||
                     event.createdById === session.user.id

    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Delete comment
    await db.delete(comments).where(eq(comments.id, commentId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const { commentId, content } = body

    // Validate input
    const validation = z.object({
      content: z.string().min(1).max(1000),
    }).safeParse({ content })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }

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

    // Check if comment exists and belongs to this event and user
    const existingComment = await db.query.comments.findFirst({
      where: and(
        eq(comments.id, commentId),
        eq(comments.eventId, eventId),
        eq(comments.authorId, session.user.id)
      )
    })

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found or access denied' }, { status: 404 })
    }

    // Update comment
    const updatedComment = await db.update(comments).set({
      content,
      isEdited: true,
      updatedAt: new Date(),
    }).where(eq(comments.id, commentId)).returning()

    return NextResponse.json(updatedComment[0])
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}