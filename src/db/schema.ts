import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// clubs
// ---------------------------------------------------------------------------
export const clubs = pgTable('clubs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const clubsRelations = relations(clubs, ({ many }) => ({
  users: many(users),
  teams: many(teams),
  events: many(events),
  posts: many(posts),
  messages: many(messages),
  surveys: many(surveys),
  cotisations: many(cotisations),
  expenses: many(expenses),
  sponsors: many(sponsors),
}))

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export type UserRole = 'user' | 'manager_sportif' | 'manager_associatif' | 'admin'

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    // nullable : Better-Auth crée l'user sans clubId, on l'assigne juste après
    clubId: text('club_id')
      .references(() => clubs.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    phone: text('phone'),
    name: text('name').notNull(),
    image: text('image'),
    role: text('role').$type<UserRole>().notNull().default('user'),
    birthDate: timestamp('birth_date'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    index('users_club_role_idx').on(t.clubId, t.role),
    uniqueIndex('users_club_email_idx').on(t.clubId, t.email),
  ],
)

export const usersRelations = relations(users, ({ one, many }) => ({
  club: one(clubs, { fields: [users.clubId], references: [clubs.id] }),
  managedTeams: many(teams),
  convocations: many(convocations),
  presences: many(presences),
  performances: many(performances),
  cotisations: many(cotisations),
  surveyResponses: many(surveyResponses),
  eventRegistrations: many(eventRegistrations),
  assignedTasks: many(eventTasks),
  messages: many(messages),
  expenses: many(expenses),
}))

// ---------------------------------------------------------------------------
// Better-Auth required tables
// ---------------------------------------------------------------------------
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// teams
// ---------------------------------------------------------------------------
export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  clubId: text('club_id')
    .notNull()
    .references(() => clubs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  season: text('season').notNull(),
  managerId: text('manager_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const teamsRelations = relations(teams, ({ one, many }) => ({
  club: one(clubs, { fields: [teams.clubId], references: [clubs.id] }),
  manager: one(users, { fields: [teams.managerId], references: [users.id] }),
  events: many(events),
  messages: many(messages),
}))

// ---------------------------------------------------------------------------
// events
// ---------------------------------------------------------------------------
export type EventType = 'match' | 'training' | 'other'

export const events = pgTable(
  'events',
  {
    id: text('id').primaryKey(),
    clubId: text('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    teamId: text('team_id').references(() => teams.id, { onDelete: 'set null' }),
    type: text('type').$type<EventType>().notNull(),
    title: text('title').notNull(),
    date: timestamp('date').notNull(),
    location: text('location'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('events_club_team_date_idx').on(t.clubId, t.teamId, t.date)],
)

export const eventsRelations = relations(events, ({ one, many }) => ({
  club: one(clubs, { fields: [events.clubId], references: [clubs.id] }),
  team: one(teams, { fields: [events.teamId], references: [teams.id] }),
  convocations: many(convocations),
  presences: many(presences),
  performances: many(performances),
  tasks: many(eventTasks),
  registrations: many(eventRegistrations),
}))

// ---------------------------------------------------------------------------
// convocations
// ---------------------------------------------------------------------------
export type ConvocationStatus = 'pending' | 'confirmed' | 'declined'

export const convocations = pgTable(
  'convocations',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').$type<ConvocationStatus>().notNull().default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('convocations_event_user_idx').on(t.eventId, t.userId)],
)

export const convocationsRelations = relations(convocations, ({ one }) => ({
  event: one(events, { fields: [convocations.eventId], references: [events.id] }),
  user: one(users, { fields: [convocations.userId], references: [users.id] }),
}))

// ---------------------------------------------------------------------------
// presences
// ---------------------------------------------------------------------------
export const presences = pgTable(
  'presences',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    present: boolean('present').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('presences_event_user_idx').on(t.eventId, t.userId)],
)

export const presencesRelations = relations(presences, ({ one }) => ({
  event: one(events, { fields: [presences.eventId], references: [events.id] }),
  user: one(users, { fields: [presences.userId], references: [users.id] }),
}))

// ---------------------------------------------------------------------------
// performances
// ---------------------------------------------------------------------------
export const performances = pgTable('performances', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stats: jsonb('stats').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const performancesRelations = relations(performances, ({ one }) => ({
  event: one(events, { fields: [performances.eventId], references: [events.id] }),
  user: one(users, { fields: [performances.userId], references: [users.id] }),
}))

// ---------------------------------------------------------------------------
// posts
// ---------------------------------------------------------------------------
export type PostType = 'result' | 'news'

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  clubId: text('club_id')
    .notNull()
    .references(() => clubs.id, { onDelete: 'cascade' }),
  type: text('type').$type<PostType>().notNull(),
  content: text('content').notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const postsRelations = relations(posts, ({ one }) => ({
  club: one(clubs, { fields: [posts.clubId], references: [clubs.id] }),
}))

// ---------------------------------------------------------------------------
// messages
// ---------------------------------------------------------------------------
export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey(),
    clubId: text('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    teamId: text('team_id').references(() => teams.id, { onDelete: 'set null' }),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('messages_club_team_idx').on(t.clubId, t.teamId)],
)

export const messagesRelations = relations(messages, ({ one }) => ({
  club: one(clubs, { fields: [messages.clubId], references: [clubs.id] }),
  team: one(teams, { fields: [messages.teamId], references: [teams.id] }),
  author: one(users, { fields: [messages.authorId], references: [users.id] }),
}))

// ---------------------------------------------------------------------------
// surveys
// ---------------------------------------------------------------------------
export const surveys = pgTable('surveys', {
  id: text('id').primaryKey(),
  clubId: text('club_id')
    .notNull()
    .references(() => clubs.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  club: one(clubs, { fields: [surveys.clubId], references: [clubs.id] }),
  responses: many(surveyResponses),
}))

export const surveyResponses = pgTable('survey_responses', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id')
    .notNull()
    .references(() => surveys.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  answer: jsonb('answer').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(surveys, { fields: [surveyResponses.surveyId], references: [surveys.id] }),
  user: one(users, { fields: [surveyResponses.userId], references: [users.id] }),
}))

// ---------------------------------------------------------------------------
// cotisations
// ---------------------------------------------------------------------------
export type CotisationStatus = 'pending' | 'paid' | 'late'

export const cotisations = pgTable(
  'cotisations',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clubId: text('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(), // en centimes
    status: text('status').$type<CotisationStatus>().notNull().default('pending'),
    dueDate: timestamp('due_date').notNull(),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('cotisations_user_idx').on(t.userId),
    index('cotisations_club_status_idx').on(t.clubId, t.status),
  ],
)

export const cotisationsRelations = relations(cotisations, ({ one }) => ({
  user: one(users, { fields: [cotisations.userId], references: [users.id] }),
  club: one(clubs, { fields: [cotisations.clubId], references: [clubs.id] }),
}))

// ---------------------------------------------------------------------------
// expenses
// ---------------------------------------------------------------------------
export const expenses = pgTable(
  'expenses',
  {
    id: text('id').primaryKey(),
    clubId: text('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(), // en centimes
    category: text('category').notNull(),
    receiptUrl: text('receipt_url'),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('expenses_club_created_idx').on(t.clubId, t.createdAt)],
)

export const expensesRelations = relations(expenses, ({ one }) => ({
  club: one(clubs, { fields: [expenses.clubId], references: [clubs.id] }),
  author: one(users, { fields: [expenses.authorId], references: [users.id] }),
}))

// ---------------------------------------------------------------------------
// sponsors
// ---------------------------------------------------------------------------
export const sponsors = pgTable('sponsors', {
  id: text('id').primaryKey(),
  clubId: text('club_id')
    .notNull()
    .references(() => clubs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  amount: integer('amount').notNull(), // en centimes
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const sponsorsRelations = relations(sponsors, ({ one }) => ({
  club: one(clubs, { fields: [sponsors.clubId], references: [clubs.id] }),
}))

// ---------------------------------------------------------------------------
// event_tasks
// ---------------------------------------------------------------------------
export const eventTasks = pgTable('event_tasks', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  done: boolean('done').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const eventTasksRelations = relations(eventTasks, ({ one }) => ({
  event: one(events, { fields: [eventTasks.eventId], references: [events.id] }),
  assignee: one(users, { fields: [eventTasks.assigneeId], references: [users.id] }),
}))

// ---------------------------------------------------------------------------
// event_registrations
// ---------------------------------------------------------------------------
export const eventRegistrations = pgTable('event_registrations', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, { fields: [eventRegistrations.eventId], references: [events.id] }),
  user: one(users, { fields: [eventRegistrations.userId], references: [users.id] }),
}))
