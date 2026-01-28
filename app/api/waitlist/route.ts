import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const connectionString = process.env.NEON_DATABASE_URL

export async function POST(request: Request) {
  try {
    // Check if database is configured
    if (!connectionString) {
      console.error('NEON_DATABASE_URL is not configured')
      return NextResponse.json(
        {
          ok: false,
          error: 'Server configuration error. Please try again later.',
        },
        { status: 500 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request format.' },
        { status: 400 }
      )
    }

    const { email } = body

    // Validate email presence
    if (typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Email is required.' },
        { status: 400 }
      )
    }

    const trimmed = email.trim().toLowerCase()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      return NextResponse.json(
        { ok: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    // Validate email length (prevent extremely long strings)
    if (trimmed.length > 255) {
      return NextResponse.json(
        { ok: false, error: 'Email address is too long.' },
        { status: 400 }
      )
    }

    // Initialize database connection
    let sql
    try {
      sql = neon(connectionString)
    } catch (err) {
      console.error('Failed to initialize database connection:', err)
      return NextResponse.json(
        {
          ok: false,
          error: 'Database connection error. Please try again later.',
        },
        { status: 500 }
      )
    }

    // Insert email into database
    try {
      await sql`INSERT INTO public.waitlist_signups (email) VALUES (${trimmed})`
      
      return NextResponse.json(
        { 
          ok: true, 
          message: 'You\'re on the waitlist. We\'ll be in touch soon.' 
        },
        { status: 200 }
      )
    } catch (err: any) {
      // Handle duplicate email (PostgreSQL unique constraint violation)
      if (err?.code === '23505') {
        return NextResponse.json(
          { 
            ok: true, 
            message: 'You\'re already on the waitlist! We\'ll be in touch soon.' 
          },
          { status: 200 }
        )
      }

      // Handle other database errors
      if (err?.code === '23514') {
        // Check constraint violation
        return NextResponse.json(
          { ok: false, error: 'Invalid email format.' },
          { status: 400 }
        )
      }

      // Connection/timeout errors
      if (err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT') {
        console.error('Database connection failed:', err)
        return NextResponse.json(
          {
            ok: false,
            error: 'Unable to connect to database. Please try again later.',
          },
          { status: 503 }
        )
      }

      // Log unexpected errors
      console.error('Unexpected database error:', err)
      throw err
    }
  } catch (error) {
    // Catch-all for any unexpected errors
    console.error('Unexpected error in waitlist API:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    )
  }
}
