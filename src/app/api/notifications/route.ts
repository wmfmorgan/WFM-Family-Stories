import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

// Schema for notification
const NotificationSchema = z.object({
  type: z.enum(['comment', 'media_upload', 'event_update', 'invitation', 'system']),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  referenceId: z.string().uuid().optional(),
  referenceType: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Get notifications for the current user
    const userNotifications = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, session.user.id),
        unreadOnly ? eq(notifications.isRead, false) : undefined
      ),
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
      limit: limit > 0 ? limit : 20,
    })

    return NextResponse.json(userNotifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validation = NotificationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }

    const { type, title, message, referenceId, referenceType } = validation.data

    // Add new notification
    const newNotification = await db.insert(notifications).values({
      userId: session.user.id,
      type,
      title,
      message,
      referenceId,
      referenceType,
    }).returning()

    return NextResponse.json(newNotification[0], { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, isRead } = body

    // Validate input
    const validation = z.object({
      notificationId: z.string().uuid(),
      isRead: z.boolean(),
    }).safeParse({ notificationId, isRead })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }

    // Check if notification exists and belongs to this user
    const existingNotification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, session.user.id)
      )
    })

    if (!existingNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Update notification
    const updatedNotification = await db.update(notifications).set({
      isRead,
      updatedAt: new Date(),
    }).where(eq(notifications.id, notificationId)).returning()

    return NextResponse.json(updatedNotification[0])
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId } = body

    // Validate input
    const validation = z.object({
      notificationId: z.string().uuid(),
    }).safeParse({ notificationId })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }

    // Check if notification exists and belongs to this user
    const existingNotification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, session.user.id)
      )
    })

    if (!existingNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Delete notification
    await db.delete(notifications).where(eq(notifications.id, notificationId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}