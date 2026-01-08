import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { families, familyMembers, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET /api/families/[id] - Get a specific family
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the user is a member of this family
    const [member] = await db
      .select()
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, params.id),
        eq(familyMembers.userId, session.user.id)
      ))
      .limit(1)

    if (!member) {
      return NextResponse.json({ error: 'Family not found or access denied' }, { status: 404 })
    }

    // Fetch the family details
    const [family] = await db
      .select()
      .from(families)
      .where(eq(families.id, params.id))
      .limit(1)

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    return NextResponse.json(family)
  } catch (error) {
    console.error('Failed to fetch family:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/families/[id] - Update a family
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the user is an admin of this family
    const [member] = await db
      .select()
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, params.id),
        eq(familyMembers.userId, session.user.id),
        eq(familyMembers.role, 'admin')
      ))
      .limit(1)

    if (!member) {
      return NextResponse.json({ error: 'Unauthorized to update family' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Family name is required' },
        { status: 400 }
      )
    }

    // Update the family
    const [updatedFamily] = await db
      .update(families)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .where(eq(families.id, params.id))
      .returning()

    return NextResponse.json(updatedFamily)
  } catch (error) {
    console.error('Failed to update family:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/families/[id] - Delete a family
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the user is an admin of this family
    const [member] = await db
      .select()
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, params.id),
        eq(familyMembers.userId, session.user.id),
        eq(familyMembers.role, 'admin')
      ))
      .limit(1)

    if (!member) {
      return NextResponse.json({ error: 'Unauthorized to delete family' }, { status: 403 })
    }

    // Delete the family
    await db.delete(families).where(eq(families.id, params.id))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Failed to delete family:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}