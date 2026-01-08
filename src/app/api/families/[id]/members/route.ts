import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { familyMembers, families, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET /api/families/[id]/members - Get family members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a member of the family
    const userMembership = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.familyId, params.id),
          eq(familyMembers.userId, session.user.id)
        )
      )
      .limit(1)

    if (userMembership.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const members = await db
      .select({
        id: familyMembers.id,
        userId: familyMembers.userId,
        role: familyMembers.role,
        joinedAt: familyMembers.joinedAt,
        user: {
          name: users.name,
          email: users.email,
        },
      })
      .from(familyMembers)
      .innerJoin(users, eq(familyMembers.userId, users.id))
      .where(eq(familyMembers.familyId, params.id))
      .orderBy(familyMembers.joinedAt)

    return NextResponse.json(members)
  } catch (error) {
    console.error('Failed to fetch family members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/families/[id]/members - Add a new member (placeholder for future)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an admin of the family
    const userMembership = await db
      .select({ role: familyMembers.role })
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.familyId, params.id),
          eq(familyMembers.userId, session.user.id)
        )
      )
      .limit(1)

    if (userMembership.length === 0 || userMembership[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Only family admins can add members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found. They must sign up first.' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.familyId, params.id),
          eq(familyMembers.userId, existingUser[0].id)
        )
      )
      .limit(1)

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: 'User is already a member of this family' },
        { status: 400 }
      )
    }

    // Add user to family
    const [newMember] = await db
      .insert(familyMembers)
      .values({
        familyId: params.id,
        userId: existingUser[0].id,
        role: 'member',
      })
      .returning()

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error('Failed to add family member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/families/[id]/members/[memberId] - Remove a member (would be a separate route)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Member removal not implemented yet' },
    { status: 501 }
  )
}