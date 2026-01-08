import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { families, familyMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/families - Get all families for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userFamilies = await db
      .select({
        id: families.id,
        name: families.name,
        description: families.description,
        createdAt: families.createdAt,
        role: familyMembers.role,
      })
      .from(familyMembers)
      .innerJoin(families, eq(familyMembers.familyId, families.id))
      .where(eq(familyMembers.userId, session.user.id))

    return NextResponse.json(userFamilies)
  } catch (error) {
    console.error('Failed to fetch families:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/families - Create a new family
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Family name is required' },
        { status: 400 }
      )
    }

    // Create the family
    const [newFamily] = await db
      .insert(families)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        createdById: session.user.id,
      })
      .returning()

    // Add the creator as an admin member
    await db.insert(familyMembers).values({
      familyId: newFamily.id,
      userId: session.user.id,
      role: 'admin',
    })

    return NextResponse.json(newFamily, { status: 201 })
  } catch (error) {
    console.error('Failed to create family:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}