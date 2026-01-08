import { pgTable, text, integer, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table (NextAuth expects 'user' table name)
export const users = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  image: text('image'),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Families table
export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  settings: jsonb('settings').$type<{
    isPublic: boolean
    allowJoinRequests: boolean
    maxMembers?: number
  }>().default({
    isPublic: false,
    allowJoinRequests: true,
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Family members junction table
export const familyMembers = pgTable('family_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['admin', 'member'] }).default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  uniqueFamilyUser: [table.familyId, table.userId],
}))

// Events table
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  date: timestamp('date', { mode: 'date' }).notNull(),
  location: text('location'),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'cascade' }).notNull(),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  eventType: text('event_type', {
    enum: ['wedding', 'birthday', 'holiday', 'graduation', 'anniversary', 'vacation', 'other']
  }).default('other'),
  tags: jsonb('tags').$type<string[]>().default([]),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Media attachments for events
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  uploadedById: uuid('uploaded_by_id').references(() => users.id).notNull(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  url: text('url'), // For cloud storage URLs
  altText: text('alt_text'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Comments on events
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  parentId: uuid('parent_id').references(() => comments.id), // For nested replies
  isEdited: boolean('is_edited').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Event contributors for multi-user editing
export const eventContributors = pgTable('event_contributors', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['owner', 'editor', 'viewer'] }).default('editor').notNull(),
  addedById: uuid('added_by_id').references(() => users.id).notNull(),
  canEdit: boolean('can_edit').default(true),
  canDelete: boolean('can_delete').default(false),
  canInvite: boolean('can_invite').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueEventUser: [table.eventId, table.userId],
}))

// Notifications for user alerts
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type', {
    enum: ['comment', 'media_upload', 'event_update', 'invitation', 'system']
  }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  referenceId: uuid('reference_id'), // ID of the related entity (event, comment, etc.)
  referenceType: text('reference_type'), // Type of the related entity
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Privacy settings for events
export const eventPrivacy = pgTable('event_privacy', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  canView: boolean('can_view').default(true),
  canEdit: boolean('can_edit').default(false),
  canComment: boolean('can_comment').default(true),
  canUploadMedia: boolean('can_upload_media').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueEventUserPrivacy: [table.eventId, table.userId],
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdFamilies: many(families),
  familyMemberships: many(familyMembers),
  createdEvents: many(events),
  uploadedMedia: many(media),
  comments: many(comments),
  eventContributions: many(eventContributors),
  notifications: many(notifications),
  eventPrivacySettings: many(eventPrivacy),
}))

export const eventContributorsRelations = relations(eventContributors, ({ one }) => ({
  event: one(events, {
    fields: [eventContributors.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventContributors.userId],
    references: [users.id],
  }),
  addedBy: one(users, {
    fields: [eventContributors.addedById],
    references: [users.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

export const eventPrivacyRelations = relations(eventPrivacy, ({ one }) => ({
  event: one(events, {
    fields: [eventPrivacy.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventPrivacy.userId],
    references: [users.id],
  }),
}))

export const familiesRelations = relations(families, ({ one, many }) => ({
  creator: one(users, {
    fields: [families.createdById],
    references: [users.id],
  }),
  members: many(familyMembers),
  events: many(events),
}))

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  family: one(families, {
    fields: [familyMembers.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
  }),
}))

export const eventsRelations = relations(events, ({ one, many }) => ({
  family: one(families, {
    fields: [events.familyId],
    references: [families.id],
  }),
  creator: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  media: many(media),
  comments: many(comments),
}))

export const mediaRelations = relations(media, ({ one }) => ({
  event: one(events, {
    fields: [media.eventId],
    references: [events.id],
  }),
  uploader: one(users, {
    fields: [media.uploadedById],
    references: [users.id],
  }),
}))

export const commentsRelations = relations(comments, ({ one, many }) => ({
  event: one(events, {
    fields: [comments.eventId],
    references: [events.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
}))

// Types for TypeScript
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Family = typeof families.$inferSelect
export type NewFamily = typeof families.$inferInsert

export type FamilyMember = typeof familyMembers.$inferSelect
export type NewFamilyMember = typeof familyMembers.$inferInsert

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert

export type Media = typeof media.$inferSelect
export type NewMedia = typeof media.$inferInsert

export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert

export type EventContributor = typeof eventContributors.$inferSelect
export type NewEventContributor = typeof eventContributors.$inferInsert

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert

export type EventPrivacy = typeof eventPrivacy.$inferSelect
export type NewEventPrivacy = typeof eventPrivacy.$inferInsert
