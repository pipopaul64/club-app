import { describe, it, expect } from 'vitest'
import {
  createUserSchema,
  createTeamSchema,
  createEventSchema,
  createCotisationSchema,
  createExpenseSchema,
  createSponsorSchema,
  createSurveySchema,
  createMessageSchema,
} from './validations'

// ---------------------------------------------------------------------------
// createUserSchema
// ---------------------------------------------------------------------------
describe('createUserSchema', () => {
  const valid = {
    name: 'Jean Dupont',
    email: 'jean@example.com',
    phone: '+33 6 12 34 56 78',
    roles: [] as ('manager' | 'admin')[],
  }

  it('accepts a valid user with no extra roles', () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects name shorter than 2 chars', () => {
    const result = createUserSchema.safeParse({ ...valid, name: 'J' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = createUserSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('accepts empty string phone (optional)', () => {
    const result = createUserSchema.safeParse({ ...valid, phone: '' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid phone format', () => {
    const result = createUserSchema.safeParse({ ...valid, phone: 'abc' })
    expect(result.success).toBe(false)
  })

  it('rejects unknown role', () => {
    const result = createUserSchema.safeParse({ ...valid, roles: ['superadmin'] })
    expect(result.success).toBe(false)
  })

  it('rejects implicit user role being assigned explicitly', () => {
    const result = createUserSchema.safeParse({ ...valid, roles: ['user'] })
    expect(result.success).toBe(false)
  })

  it('accepts manager and admin roles individually and combined', () => {
    expect(createUserSchema.safeParse({ ...valid, roles: ['manager'] }).success).toBe(true)
    expect(createUserSchema.safeParse({ ...valid, roles: ['admin'] }).success).toBe(true)
    expect(createUserSchema.safeParse({ ...valid, roles: ['manager', 'admin'] }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createTeamSchema
// ---------------------------------------------------------------------------
describe('createTeamSchema', () => {
  const valid = { name: 'Équipe A', category: 'U17', season: '2024-2025' }

  it('accepts a valid team', () => {
    expect(createTeamSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects bad season format', () => {
    expect(createTeamSchema.safeParse({ ...valid, season: '2024/2025' }).success).toBe(false)
    expect(createTeamSchema.safeParse({ ...valid, season: '20242025' }).success).toBe(false)
  })

  it('rejects non-consecutive years', () => {
    const result = createTeamSchema.safeParse({ ...valid, season: '2024-2026' })
    expect(result.success).toBe(false)
  })

  it('rejects empty category', () => {
    expect(createTeamSchema.safeParse({ ...valid, category: '' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createEventSchema
// ---------------------------------------------------------------------------
describe('createEventSchema', () => {
  const valid = {
    title: 'Match retour',
    type: 'match' as const,
    date: '2025-06-15T15:00',
  }

  it('accepts a valid event', () => {
    expect(createEventSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects unknown event type', () => {
    expect(createEventSchema.safeParse({ ...valid, type: 'tournament' }).success).toBe(false)
  })

  it('rejects missing date', () => {
    expect(createEventSchema.safeParse({ ...valid, date: '' }).success).toBe(false)
  })

  it('accepts all valid types', () => {
    for (const type of ['match', 'training', 'other'] as const) {
      expect(createEventSchema.safeParse({ ...valid, type }).success).toBe(true)
    }
  })

  it('accepts optional location and teamId', () => {
    const result = createEventSchema.safeParse({
      ...valid,
      location: 'Stade Municipal',
      teamId: 'some-uuid',
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createCotisationSchema
// ---------------------------------------------------------------------------
describe('createCotisationSchema', () => {
  const valid = {
    userId: 'user-123',
    amount: 150,
    dueDate: '2025-09-01',
  }

  it('accepts a valid cotisation', () => {
    expect(createCotisationSchema.safeParse(valid).success).toBe(true)
  })

  it('coerces string amount to number', () => {
    const result = createCotisationSchema.safeParse({ ...valid, amount: '150' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.amount).toBe(150)
  })

  it('rejects zero amount', () => {
    expect(createCotisationSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false)
  })

  it('rejects negative amount', () => {
    expect(createCotisationSchema.safeParse({ ...valid, amount: -50 }).success).toBe(false)
  })

  it('rejects amount over 99999', () => {
    expect(createCotisationSchema.safeParse({ ...valid, amount: 100000 }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createExpenseSchema
// ---------------------------------------------------------------------------
describe('createExpenseSchema', () => {
  const valid = {
    amount: 45.5,
    category: 'deplacement' as const,
    description: 'Essence trajet match',
  }

  it('accepts a valid expense', () => {
    expect(createExpenseSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects unknown category', () => {
    expect(createExpenseSchema.safeParse({ ...valid, category: 'other-thing' }).success).toBe(false)
  })

  it('rejects description longer than 500 chars', () => {
    const result = createExpenseSchema.safeParse({
      ...valid,
      description: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty receiptUrl', () => {
    expect(createExpenseSchema.safeParse({ ...valid, receiptUrl: '' }).success).toBe(true)
  })

  it('rejects invalid receiptUrl', () => {
    expect(createExpenseSchema.safeParse({ ...valid, receiptUrl: 'not-a-url' }).success).toBe(false)
  })

  it('accepts all valid categories', () => {
    const cats = ['equipement', 'deplacement', 'arbitrage', 'licence', 'communication', 'autre'] as const
    for (const category of cats) {
      expect(createExpenseSchema.safeParse({ ...valid, category }).success).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// createSponsorSchema
// ---------------------------------------------------------------------------
describe('createSponsorSchema', () => {
  const valid = {
    name: 'Sponsor SA',
    amount: 5000,
    startDate: '2025-01-01',
  }

  it('accepts a valid sponsor', () => {
    expect(createSponsorSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects name shorter than 2 chars', () => {
    expect(createSponsorSchema.safeParse({ ...valid, name: 'X' }).success).toBe(false)
  })

  it('rejects amount > 9999999', () => {
    expect(createSponsorSchema.safeParse({ ...valid, amount: 10_000_000 }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createSurveySchema
// ---------------------------------------------------------------------------
describe('createSurveySchema', () => {
  it('accepts a valid survey title', () => {
    expect(createSurveySchema.safeParse({ title: 'Sondage participation' }).success).toBe(true)
  })

  it('rejects title shorter than 2 chars', () => {
    expect(createSurveySchema.safeParse({ title: 'Q' }).success).toBe(false)
  })

  it('rejects title longer than 500 chars', () => {
    expect(createSurveySchema.safeParse({ title: 'x'.repeat(501) }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createMessageSchema
// ---------------------------------------------------------------------------
describe('createMessageSchema', () => {
  it('accepts a valid message', () => {
    expect(createMessageSchema.safeParse({ content: 'Entraînement annulé ce soir.' }).success).toBe(true)
  })

  it('rejects empty content', () => {
    expect(createMessageSchema.safeParse({ content: '' }).success).toBe(false)
  })

  it('rejects content longer than 2000 chars', () => {
    expect(createMessageSchema.safeParse({ content: 'x'.repeat(2001) }).success).toBe(false)
  })

  it('accepts optional teamId', () => {
    expect(createMessageSchema.safeParse({ content: 'Message', teamId: 'team-uuid' }).success).toBe(true)
  })
})
