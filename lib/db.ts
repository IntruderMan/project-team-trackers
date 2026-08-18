import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'

export type BoardData = {
  members: unknown[]
  leaves: unknown[]
  modules: unknown[]
}

const databasePath = path.join(process.cwd(), 'data', 'tracker.sqlite')
const globalForDatabase = globalThis as typeof globalThis & { trackerDatabase?: DatabaseSync }
fs.mkdirSync(path.dirname(databasePath), { recursive: true })
const db = globalForDatabase.trackerDatabase ?? new DatabaseSync(databasePath)

if (process.env.NODE_ENV !== 'production') globalForDatabase.trackerDatabase = db

db.exec(`
  CREATE TABLE IF NOT EXISTS tracker_data (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    members TEXT NOT NULL,
    leaves TEXT NOT NULL,
    modules TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

const seed: BoardData = {
  members: [
    { id: 'm1', name: 'Olivia Martin', role: 'Product Designer', color: '#6d7df6', initials: 'OM' },
    { id: 'm2', name: 'Ethan Wong', role: 'Frontend Engineer', color: '#43b79d', initials: 'EW' },
    { id: 'm3', name: 'Sophia Patel', role: 'Product Manager', color: '#f09a62', initials: 'SP' },
    { id: 'm4', name: 'Lucas Reed', role: 'Backend Engineer', color: '#c37ce7', initials: 'LR' },
  ],
  leaves: [
    { id: 'l1', memberId: 'm1', start: '2026-08-05', end: '2026-08-05', type: 'half', session: 'PM', reason: 'Doctor appointment', status: 'Approved' },
    { id: 'l2', memberId: 'm2', start: '2026-08-11', end: '2026-08-13', type: 'full', reason: 'Family trip', status: 'Approved' },
    { id: 'l3', memberId: 'm3', start: '2026-08-19', end: '2026-08-21', type: 'full', reason: 'Summer holiday', status: 'Pending' },
    { id: 'l4', memberId: 'm4', start: '2026-08-24', end: '2026-08-24', type: 'half', session: 'AM', reason: 'Personal errand', status: 'Approved' },
  ],
  modules: [
    { id: 'd1', month: 'August', phase: 'Milestone 9', module: 'Cars and Maps / mobile app cars and maps / dalux mobile app', hours: '', design: 'Completed', development: 'In Progress', target: 'August', dependencies: 'Tracking Device\nMappox account\nGoogle map 360 Access', questions: 'Missing the flow for the connectivity in the figma design?\nCan we connect within and company device?\nShould we start the work for the mobile application with GPC tracking functionality and login.' },
    { id: 'd2', month: 'August', phase: 'Milestone 9', module: 'Review all the platform with all modules', hours: '', design: 'Completed', development: 'Pending', target: 'August', dependencies: '', questions: '' },
    { id: 'd3', month: 'August', phase: 'Change Request', module: 'Slack Integration / status notifications', hours: '274', design: 'In Progress', development: 'In Progress', target: 'End of August', dependencies: '', questions: 'Slack workspace OAuth credentials needed !' },
    { id: 'd4', month: 'August', phase: 'M-1', module: 'Multilingual Support — Norwegian', hours: '', design: 'Completed', development: 'In Progress', target: 'August', dependencies: '', questions: '' },
    { id: 'd5', month: 'August', phase: 'Change Request', module: 'Home Page Enhancements', hours: '', design: 'In Progress', development: 'Planned', target: 'Planned', dependencies: '', questions: 'When we will get the design for the Homepage ?' },
    { id: 'd6', month: 'August', phase: 'Change Request', module: 'National Admin / home owner', hours: '', design: 'In Progress', development: 'In Progress', target: 'Planned', dependencies: 'Proff (for the financials)\nSkatteetaten (Tax)\nCredit Check (Credit score)\nDNB (Financial)\nPurehelp (Contact)', questions: 'When we will get the design for the National Admin ?' },
    { id: 'd7', month: 'September', phase: 'User Acceptance Testing (UAT)', module: 'UAT for All Modules', hours: '', design: 'Pending', development: 'Pending', target: 'September', dependencies: '', questions: '' },
    { id: 'd8', month: 'September', phase: 'M-2', module: 'Multilingual Support — Additional 6 Languages', hours: '', design: 'Planned', development: 'Planned', target: 'Planned', dependencies: '', questions: '' },
  ],
}

const existing = db.prepare('SELECT id FROM tracker_data WHERE id = 1').get()
if (!existing) {
  db.prepare('INSERT INTO tracker_data (id, members, leaves, modules, updated_at) VALUES (1, ?, ?, ?, ?)').run(
    JSON.stringify(seed.members), JSON.stringify(seed.leaves), JSON.stringify(seed.modules), new Date().toISOString(),
  )
}

export function getBoardData(): BoardData {
  const row = db.prepare('SELECT members, leaves, modules FROM tracker_data WHERE id = 1').get() as { members: string; leaves: string; modules: string }
  return { members: JSON.parse(row.members), leaves: JSON.parse(row.leaves), modules: JSON.parse(row.modules) }
}

export function saveBoardData(data: BoardData) {
  db.prepare('UPDATE tracker_data SET members = ?, leaves = ?, modules = ?, updated_at = ? WHERE id = 1').run(
    JSON.stringify(data.members), JSON.stringify(data.leaves), JSON.stringify(data.modules), new Date().toISOString(),
  )
}
