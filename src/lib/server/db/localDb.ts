import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { JSONContent } from '@tiptap/core';
import type { User, UserWithHash } from './users';
import type { Document } from './documents';
import type { PermissionWithUser, Role } from './permissions';

const DB_DIR = resolve(process.cwd(), '.data');
const DB_PATH = resolve(DB_DIR, 'local.sqlite');

const SEEDED_HASH =
  'c951b86bc477f88f21d7562ea2e7afa8:d93067b93bc8d112a731df221ed9b7490a7fb1c44f1b67182b87119e09a7c98831932f573db3bb8d3f65e4f1ba85b924e4574651c7dc6d24ce94f59a4b8898c1'; // password123

let _db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (_db) return _db;

  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }

  _db = new DatabaseSync(DB_PATH);
  _db.exec('PRAGMA foreign_keys = ON;');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_permissions (
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'editor',
      granted_at TEXT NOT NULL,
      PRIMARY KEY (document_id, user_id),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  initSeed(_db);
  return _db;
}

function initSeed(db: DatabaseSync) {
  const users = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'sanju@example.com',
      display_name: 'Sanju'
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'anil@example.com',
      display_name: 'Anil'
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'raju@example.com',
      display_name: 'Raju'
    }
  ];

  const now = new Date().toISOString();
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, display_name, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      display_name = excluded.display_name
  `);

  for (const u of users) {
    insertUser.run(u.id, u.email, u.display_name, SEEDED_HASH, now);
  }

  // Pre-seed sample document if no documents exist
  const countRow = db.prepare('SELECT count(*) as count FROM documents').get() as { count: number };
  if (!countRow || countRow.count === 0) {
    const sampleDocId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const sampleContent: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Welcome Sanju, Anil & Raju! 🚀' }]
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'This is a lightweight collaborative document editor running completely locally.'
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Created by ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'Sanju' },
            { type: 'text', text: ' and shared with ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'Anil' },
            { type: 'text', text: ' and ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'Raju' },
            { type: 'text', text: '.' }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Capabilities you can test right now:' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Rich-text editing' },
                    { type: 'text', text: ': Bold, italic, underline, strike, headings, tables, and lists.' }
                  ]
                }
              ]
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Autosave' },
                    { type: 'text', text: ': Changes save debounced after 800ms directly to local SQLite.' }
                  ]
                }
              ]
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Sharing' },
                    { type: 'text', text: ': Grant or revoke edit access for other team members.' }
                  ]
                }
              ]
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'File Upload' },
                    { type: 'text', text: ': Upload .txt, .md, or .docx files directly into editable docs.' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    db.prepare(`
      INSERT INTO documents (id, title, content, owner_id, created_at, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      sampleDocId,
      'Welcome to Google Docs (Local)',
      JSON.stringify(sampleContent),
      users[0].id, // Sanju is owner
      now,
      now,
      users[0].id
    );

    // Share with Anil and Raju
    db.prepare(`
      INSERT INTO document_permissions (document_id, user_id, role, granted_at)
      VALUES (?, ?, 'editor', ?)
    `).run(sampleDocId, users[1].id, now);

    db.prepare(`
      INSERT INTO document_permissions (document_id, user_id, role, granted_at)
      VALUES (?, ?, 'editor', ?)
    `).run(sampleDocId, users[2].id, now);
  }
}

// --- Users Repo ---

export function localListUsers(): User[] {
  const db = getDb();
  const rows = db.prepare('SELECT id, email, display_name FROM users ORDER BY display_name ASC').all() as unknown as User[];
  return rows.map((r) => ({
    id: String(r.id),
    email: String(r.email),
    display_name: String(r.display_name)
  }));
}

export function localGetUserById(id: string): User | null {
  const db = getDb();
  const row = db.prepare('SELECT id, email, display_name FROM users WHERE id = ?').get(id) as unknown as User | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    email: String(row.email),
    display_name: String(row.display_name)
  };
}

export function localFindByEmail(email: string): UserWithHash | null {
  const db = getDb();
  const row = db.prepare('SELECT id, email, display_name, password_hash FROM users WHERE lower(email) = lower(?)').get(email) as unknown as UserWithHash | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    email: String(row.email),
    display_name: String(row.display_name),
    password_hash: String(row.password_hash)
  };
}

export function localCreateUser(args: {
  email: string;
  displayName: string;
  passwordHash: string;
}): User {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO users (id, email, display_name, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, args.email.toLowerCase(), args.displayName, args.passwordHash, now);

  return {
    id,
    email: args.email.toLowerCase(),
    display_name: args.displayName
  };
}

// --- Documents Repo ---

const EMPTY_CONTENT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }]
};

function parseDocRow(row: {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}): Document {
  let content: JSONContent;
  try {
    content = JSON.parse(row.content);
  } catch {
    content = EMPTY_CONTENT;
  }
  return {
    id: String(row.id),
    title: String(row.title),
    content,
    owner_id: String(row.owner_id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    updated_by: row.updated_by ? String(row.updated_by) : null
  };
}

export function localListOwnedByUser(userId: string): Document[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, title, content, owner_id, created_at, updated_at, updated_by
    FROM documents
    WHERE owner_id = ?
    ORDER BY updated_at DESC
  `).all(userId) as unknown as Parameters<typeof parseDocRow>[0][];

  return rows.map(parseDocRow);
}

export function localListSharedWithUser(userId: string): Document[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT d.id, d.title, d.content, d.owner_id, d.created_at, d.updated_at, d.updated_by
    FROM documents d
    JOIN document_permissions p ON d.id = p.document_id
    WHERE p.user_id = ? AND d.owner_id != ?
    ORDER BY d.updated_at DESC
  `).all(userId, userId) as unknown as Parameters<typeof parseDocRow>[0][];

  return rows.map(parseDocRow);
}

export function localGetDocById(id: string): Document | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, title, content, owner_id, created_at, updated_at, updated_by
    FROM documents
    WHERE id = ?
  `).get(id) as unknown as Parameters<typeof parseDocRow>[0] | undefined;

  if (!row) return null;
  return parseDocRow(row);
}

export function localCreateDoc(
  ownerId: string,
  opts: { title?: string; content?: JSONContent } = {}
): Document {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const title = opts.title ?? 'Untitled';
  const content = opts.content ?? EMPTY_CONTENT;

  db.prepare(`
    INSERT INTO documents (id, title, content, owner_id, created_at, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, JSON.stringify(content), ownerId, now, now, ownerId);

  return {
    id,
    title,
    content,
    owner_id: ownerId,
    created_at: now,
    updated_at: now,
    updated_by: ownerId
  };
}

export function localRenameDoc(id: string, title: string, byUserId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE documents
    SET title = ?, updated_by = ?, updated_at = ?
    WHERE id = ?
  `).run(title, byUserId, now, id);
}

export function localUpdateDocContent(
  id: string,
  content: JSONContent,
  byUserId: string
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE documents
    SET content = ?, updated_by = ?, updated_at = ?
    WHERE id = ?
  `).run(JSON.stringify(content), byUserId, now, id);
}

export function localDeleteDocById(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
}

// --- Permissions Repo ---

export function localListPermissionsForDoc(docId: string): PermissionWithUser[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.document_id, p.user_id, p.role, p.granted_at,
           u.id as u_id, u.email as u_email, u.display_name as u_display_name
    FROM document_permissions p
    JOIN users u ON p.user_id = u.id
    WHERE p.document_id = ?
    ORDER BY p.granted_at ASC
  `).all(docId) as unknown as {
    document_id: string;
    user_id: string;
    role: Role;
    granted_at: string;
    u_id: string;
    u_email: string;
    u_display_name: string;
  }[];

  return rows.map((r) => ({
    document_id: String(r.document_id),
    user_id: String(r.user_id),
    role: r.role,
    granted_at: String(r.granted_at),
    user: {
      id: String(r.u_id),
      email: String(r.u_email),
      display_name: String(r.u_display_name)
    }
  }));
}

export function localGetRoleForUser(docId: string, userId: string): Role | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT role FROM document_permissions
    WHERE document_id = ? AND user_id = ?
  `).get(docId, userId) as unknown as { role: Role } | undefined;

  return row?.role ?? null;
}

export function localGrantAccess(
  docId: string,
  userId: string,
  role: Role = 'editor'
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO document_permissions (document_id, user_id, role, granted_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(document_id, user_id) DO UPDATE SET
      role = excluded.role,
      granted_at = excluded.granted_at
  `).run(docId, userId, role, now);
}

export function localRevokeAccess(docId: string, userId: string): void {
  const db = getDb();
  db.prepare(`
    DELETE FROM document_permissions
    WHERE document_id = ? AND user_id = ?
  `).run(docId, userId);
}
