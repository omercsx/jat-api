import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';

// ============================================================
// Status enum — single source of truth for application statuses
// ============================================================
export const APPLICATION_STATUSES = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// ============================================================
// users
// ============================================================
export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex('users_email_uniq').on(t.email)],
);

// ============================================================
// companies
// ============================================================
export const companies = pgTable(
  'companies',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    website: text('website'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('companies_user_id_idx').on(t.userId)],
);

// ============================================================
// contacts
// ============================================================
export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email'),
    role: text('role'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('contacts_user_id_idx').on(t.userId),
    index('contacts_company_id_idx').on(t.companyId),
  ],
);

// ============================================================
// applications
// ============================================================
export const applications = pgTable(
  'applications',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    primaryContactId: uuid('primary_contact_id').references(() => contacts.id, {
      onDelete: 'set null',
    }),
    roleTitle: text('role_title').notNull(),
    jobPostUrl: text('job_post_url'),
    source: text('source'),
    currentStatus: text('current_status', { enum: APPLICATION_STATUSES }).notNull(),
    appliedAt: timestamp('applied_at', { withTimezone: true }),
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`'{}'`),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('applications_user_id_idx').on(t.userId),
    index('applications_company_id_idx').on(t.companyId),
    index('applications_current_status_idx').on(t.currentStatus),
    index('applications_tags_gin_idx').using('gin', t.tags),
    check(
      'applications_current_status_check',
      sql`${t.currentStatus} IN ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn')`,
    ),
  ],
);

// ============================================================
// application_status_history (append-only)
// ============================================================
export const applicationStatusHistory = pgTable(
  'application_status_history',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    status: text('status', { enum: APPLICATION_STATUSES }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('app_status_history_app_created_idx').on(t.applicationId, t.createdAt.desc()),
    check(
      'app_status_history_status_check',
      sql`${t.status} IN ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn')`,
    ),
  ],
);
