import { describe, it, expect } from 'vitest'
import {
  updateUserSchema,
  createInvitationSchema,
  redeemInviteSchema,
  completeOnboardingSchema,
  createTeamSchema,
  createEventSchema,
  createCotisationSchema,
  createExpenseSchema,
  createSponsorSchema,
  createSurveySchema,
  createMessageSchema,
} from './validations'

// ---------------------------------------------------------------------------
// updateUserSchema (createUser supprimé : la création passe par invitation)
// ---------------------------------------------------------------------------
describe('updateUserSchema', () => {
  const valid = {
    name: 'Jean Dupont',
    email: 'jean@example.com',
    phone: '+33 6 12 34 56 78',
    roles: [] as ('manager' | 'admin')[],
  }

  it('accepts a valid user with no extra roles', () => {
    expect(updateUserSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects name shorter than 2 chars', () => {
    expect(updateUserSchema.safeParse({ ...valid, name: 'J' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(updateUserSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects implicit user role being assigned explicitly', () => {
    expect(updateUserSchema.safeParse({ ...valid, roles: ['user'] }).success).toBe(false)
  })

  it('accepts manager + admin combined', () => {
    expect(updateUserSchema.safeParse({ ...valid, roles: ['manager', 'admin'] }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createInvitationSchema
// ---------------------------------------------------------------------------
describe('createInvitationSchema', () => {
  it('accepts user role', () => {
    expect(createInvitationSchema.safeParse({ email: 'a@b.com', invitedRole: 'user' }).success).toBe(true)
  })

  it('accepts manager role', () => {
    expect(createInvitationSchema.safeParse({ email: 'a@b.com', invitedRole: 'manager' }).success).toBe(true)
  })

  it('rejects admin role (not invitable)', () => {
    expect(createInvitationSchema.safeParse({ email: 'a@b.com', invitedRole: 'admin' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(createInvitationSchema.safeParse({ email: 'oops', invitedRole: 'user' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// redeemInviteSchema
// ---------------------------------------------------------------------------
describe('redeemInviteSchema', () => {
  it('accepts valid name + 8-char password', () => {
    expect(redeemInviteSchema.safeParse({ name: 'Jean', password: 'pass1234' }).success).toBe(true)
  })

  it('rejects short password', () => {
    expect(redeemInviteSchema.safeParse({ name: 'Jean', password: 'short' }).success).toBe(false)
  })

  it('rejects empty name', () => {
    expect(redeemInviteSchema.safeParse({ name: '', password: 'pass1234' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// completeOnboardingSchema
// ---------------------------------------------------------------------------
describe('completeOnboardingSchema', () => {
  it('accepts an empty payload (all optional)', () => {
    expect(completeOnboardingSchema.safeParse({}).success).toBe(true)
  })

  it('accepts arrays of teamIds', () => {
    const r = completeOnboardingSchema.safeParse({
      teamMemberIds:  ['t1', 't2'],
      teamManagerIds: ['t3'],
    })
    expect(r.success).toBe(true)
  })

  it('rejects invalid phone', () => {
    expect(completeOnboardingSchema.safeParse({ phone: 'abc' }).success).toBe(false)
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
