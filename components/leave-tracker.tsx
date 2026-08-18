'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock3, Moon, Plus, Search, Settings2, Sun, Trash2, Users, X, ClipboardList, Pencil, Upload, Image as ImageIcon, ShieldCheck, Key, Lock, Eye, LogOut, LayoutGrid, Table, Layers, Calendar } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

type Member = { id: string; name: string; role: string; color: string; initials: string; avatar?: string }
type DeliveryModule = { id: string; month: string; phase: string; module: string; hours: string; design: 'Planned' | 'In Progress' | 'Completed' | 'Pending'; development: 'Planned' | 'In Progress' | 'Completed' | 'Pending'; target: string; dependencies: string; questions: string }
type Leave = { id: string; memberId: string; start: string; end: string; type: 'full' | 'half'; session?: 'AM' | 'PM'; reason: string; status: 'Approved' | 'Pending'; kind?: 'leave' | 'work'; title?: string }

type UserRole = 'admin' | 'viewer'
type UserAccount = { id: string; name: string; email: string; role: UserRole; avatar?: string }

const publicUser: UserAccount = { id: 'public', name: 'Public Visitor', email: 'View Only Mode', role: 'viewer' }
const adminAccount = { id: 'u1', name: 'Admin', email: 'kapil@gmail.com', password: '2977', role: 'admin' as UserRole }

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
const weekdays = ['MON','TUE','WED','THU','FRI','SAT','SUN']
const iso = (d: Date) => d.toISOString().slice(0, 10)
const startOfDay = (value: string) => new Date(`${value}T12:00:00`)
const dayDiff = (a: string, b: string) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000)

export default function LeaveTracker() {
  const [members, setMembers] = useState<Member[]>([])
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [cursor, setCursor] = useState(new Date(2026, 7, 1))
  const [view, setView] = useState('month')
  const [workspace, setWorkspace] = useState<'calendar' | 'delivery' | 'team'>('calendar')
  const [modules, setModules] = useState<DeliveryModule[]>([])
  const [moduleOpen, setModuleOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<DeliveryModule | null>(null)
  const [moduleSearch, setModuleSearch] = useState('')
  const emptyModule: DeliveryModule = { id: '', month: 'August', phase: '', module: '', hours: '', design: 'Planned', development: 'Planned', target: 'Planned', dependencies: '', questions: '' }
  const [moduleDraft, setModuleDraft] = useState<DeliveryModule>(emptyModule)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [memberOpen, setMemberOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [dark, setDark] = useState(true)
  const [newLeave, setNewLeave] = useState({ memberId: 'm1', start: '2026-08-19', end: '2026-08-19', type: 'full', session: 'AM', reason: '', status: 'Approved', kind: 'leave', title: '' })
  const [newMember, setNewMember] = useState({ name: '', role: '', color: '#6d7df6', avatar: '' })
  const [hydrated, setHydrated] = useState(false)
  const handleAvatarUpload = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setNewMember((item) => ({ ...item, avatar: String(reader.result) })); reader.readAsDataURL(file) }
  const [currentUser, setCurrentUser] = useState<UserAccount>(publicUser)
  const [loginOpen, setLoginOpen] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const isAdmin = currentUser.role === 'admin'

  useEffect(() => {
    const savedUser = localStorage.getItem('tracker-auth-user')
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser))
      } catch (err) {
        console.error(err)
      }
    }
  }, [])

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (authEmail.trim().toLowerCase() === adminAccount.email.toLowerCase() && authPassword === adminAccount.password) {
      const user: UserAccount = { id: adminAccount.id, name: adminAccount.name, email: adminAccount.email, role: 'admin' }
      setCurrentUser(user)
      localStorage.setItem('tracker-auth-user', JSON.stringify(user))
      setLoginOpen(false)
      setAuthError('')
      setAuthEmail('')
      setAuthPassword('')
    } else {
      setAuthError('Invalid email address or password.')
    }
  }

  const handleLogout = () => {
    setCurrentUser(publicUser)
    localStorage.removeItem('tracker-auth-user')
  }

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const mondayOffset = (first.getDay() + 6) % 7
    return Array.from({ length: 42 }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i - mondayOffset + 1))
  }, [cursor])
  const memberMap = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members])
  const leavesFor = (date: string) => leaves.filter((l) => date >= l.start && date <= l.end)
  const today = '2026-08-18'
  const todayLeaves = leavesFor(today)
  const upcoming = leaves.filter((l) => l.start >= today).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 4)
  const monthLeaves = leaves.filter((l) => new Date(l.start).getMonth() === cursor.getMonth())

  const saveModule = () => {
    if (!moduleDraft.module.trim()) return
    setModules((items) => editingModule ? items.map((item) => item.id === editingModule.id ? { ...moduleDraft, id: editingModule.id } : item) : [...items, { ...moduleDraft, id: `d${Date.now()}` }])
    setModuleOpen(false); setEditingModule(null); setModuleDraft(emptyModule)
  }
  const openNewModule = (month = 'August') => { setEditingModule(null); setModuleDraft({ ...emptyModule, month }); setModuleOpen(true) }
  const editModule = (item: DeliveryModule) => { setEditingModule(item); setModuleDraft(item); setModuleOpen(true) }
  const removeModule = (id: string) => setModules((items) => items.filter((item) => item.id !== id))
  const filteredModules = modules.filter((item) => `${item.phase} ${item.module} ${item.target}`.toLowerCase().includes(moduleSearch.toLowerCase()))

  const addLeave = () => {
    if (newLeave.kind === 'work' && !newLeave.title.trim()) return
    const end = newLeave.type === 'half' ? newLeave.start : newLeave.end
    setLeaves((items) => [...items, { ...newLeave, id: `l${Date.now()}`, end, type: newLeave.type as 'full' | 'half', session: newLeave.type === 'half' ? newLeave.session as 'AM' | 'PM' : undefined, status: newLeave.status as 'Approved' | 'Pending', kind: newLeave.kind as 'leave' | 'work' }])
    setLeaveOpen(false)
  }
  const addMember = () => {
    if (!newMember.name.trim()) return
    const initials = newMember.name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()
    setMembers((items) => editingMember
      ? items.map((member) => member.id === editingMember.id ? { ...newMember, id: member.id, initials } : member)
      : [...items, { ...newMember, id: `m${Date.now()}`, initials }])
    setNewMember({ name: '', role: '', color: '#6d7df6', avatar: '' })
    setEditingMember(null)
    setMemberOpen(false)
  }
  const openNewMember = () => { setEditingMember(null); setNewMember({ name: '', role: '', color: '#6d7df6', avatar: '' }); setMemberOpen(true) }
  const editMember = (member: Member) => { setEditingMember(member); setNewMember({ name: member.name, role: member.role, color: member.color, avatar: member.avatar || '' }); setMemberOpen(true) }
  const removeMember = (memberId: string) => {
    setMembers((items) => items.filter((member) => member.id !== memberId))
    setLeaves((items) => items.filter((leave) => leave.memberId !== memberId))
  }
  const goMonth = (amount: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + amount, 1))
  const selectedLeaves = selectedDate ? leavesFor(selectedDate) : []
  useEffect(() => {
    let active = true
    const loadBoard = async () => {
      try {
        const hasMigrated = localStorage.getItem('tracker-sqlite-migrated') === 'true'
        const savedMembers = localStorage.getItem('tracker-members')
        const savedLeaves = localStorage.getItem('tracker-leaves')
        const savedModules = localStorage.getItem('tracker-modules')
        if (!hasMigrated && savedMembers && savedLeaves && savedModules) {
          const legacyData = { members: JSON.parse(savedMembers), leaves: JSON.parse(savedLeaves), modules: JSON.parse(savedModules) }
          const migration = await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(legacyData) })
          if (!migration.ok) throw new Error('Unable to migrate tracker data')
          localStorage.setItem('tracker-sqlite-migrated', 'true')
          if (active) { setMembers(legacyData.members); setLeaves(legacyData.leaves); setModules(legacyData.modules) }
          return
        }
        const response = await fetch('/api/data')
        if (!response.ok) throw new Error('Unable to load tracker data')
        const data = await response.json() as { members: Member[]; leaves: Leave[]; modules: DeliveryModule[] }
        if (active) { setMembers(data.members); setLeaves(data.leaves); setModules(data.modules) }
      } catch (error) {
        console.error(error)
      } finally {
        if (active) setHydrated(true)
      }
    }
    void loadBoard()
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!hydrated) return
    const controller = new AbortController()
    void fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members, leaves, modules }),
      signal: controller.signal,
    }).catch((error) => { if (error.name !== 'AbortError') console.error(error) })
    return () => controller.abort()
  }, [members, leaves, modules, hydrated])

  useEffect(() => {
    const saved = localStorage.getItem('tracker-theme')
    if (saved === 'light') {
      setDark(false)
    } else if (saved === 'dark') {
      setDark(true)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDark(prefersDark)
    }
  }, [])

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      localStorage.setItem('tracker-theme', 'dark')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
      localStorage.setItem('tracker-theme', 'light')
    }
  }, [dark])

  return (
    <div className={dark ? 'dark min-h-screen text-foreground' : 'min-h-screen text-foreground'}>
      <div className="mx-auto flex min-h-screen max-w-[1600px] p-2 sm:p-4">
        <aside className="hidden w-64 shrink-0 glass-panel rounded-3xl my-2 ml-2 px-5 py-7 lg:flex lg:flex-col shadow-2xl relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <motion.div whileHover={{ scale: 1.05, rotateY: 10 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="flex items-center gap-3 px-2 cursor-pointer">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-primary-foreground font-bold shadow-lg shadow-indigo-500/25">P</div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">Project Tracker</span>
          </motion.div>
          <div className="mt-12 flex flex-col gap-2">
            <Button variant={workspace === 'calendar' ? 'secondary' : 'ghost'} className="justify-start gap-3 rounded-xl font-medium transition-all duration-200" onClick={() => setWorkspace('calendar')}><Clock3 className="size-4" />Calendar</Button>
            <Button variant={workspace === 'delivery' ? 'secondary' : 'ghost'} className="justify-start gap-3 rounded-xl font-medium transition-all duration-200" onClick={() => setWorkspace('delivery')}><ClipboardList className="size-4" />Delivery modules</Button>
            <Button variant={workspace === 'team' ? 'secondary' : 'ghost'} className="justify-start gap-3 rounded-xl font-medium transition-all duration-200" onClick={() => setWorkspace('team')}><Users className="size-4" />Team members</Button>
          </div>
          <div className="mt-12">
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team</span>
              {isAdmin && <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={openNewMember} aria-label="Add team member"><Plus className="size-4" /></Button>}
            </div>
            <div className="flex flex-col gap-1.5">
              {members.map((member) => (
                <motion.div key={member.id} whileHover={{ x: 4, scale: 1.02 }} className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer">
                  <Avatar className="size-7 ring-1 ring-border/50" style={{ backgroundColor: `${member.color}22`, color: member.color }}>
                    {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                    <AvatarFallback className="text-xs font-bold">{member.initials}</AvatarFallback>
                  </Avatar>
                  <span className="truncate font-medium">{member.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="mt-auto flex flex-col gap-2 pt-6 border-t border-border/40">
            <Button variant="ghost" className="justify-start gap-3 rounded-xl text-xs text-muted-foreground hover:text-foreground" onClick={() => setDark(!dark)}>
              {dark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-400" />}
              {dark ? 'Light mode' : 'Dark mode'}
            </Button>
            {isAdmin ? (
              <Button variant="ghost" className="justify-start gap-3 rounded-xl text-xs text-destructive hover:bg-destructive/10 font-medium" onClick={handleLogout}>
                <LogOut className="size-4" />Sign Out Admin
              </Button>
            ) : (
              <Button variant="ghost" className="justify-start gap-3 rounded-xl text-xs text-primary hover:bg-primary/10 font-medium" onClick={() => setLoginOpen(true)}>
                <ShieldCheck className="size-4" />Admin Login
              </Button>
            )}
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-8 sm:py-6">
          {workspace === 'calendar' && (
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-primary">Tuesday, August 18, 2026</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Calendar</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Plan leave, tasks, and important work in one place.</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Button variant="outline" size="icon" className="lg:hidden rounded-xl glass-panel" onClick={() => setDark(!dark)} aria-label="Toggle theme">
                  {dark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-400" />}
                </Button>
                {isAdmin ? (
                  <>
                    <Button onClick={() => { setNewLeave({ ...newLeave, kind: 'leave', title: '' }); setLeaveOpen(true) }} className="gap-2 rounded-xl shadow-lg shadow-primary/25 transition-transform active:scale-95">
                      <Plus className="size-4" />Add leave
                    </Button>
                    <Button variant="outline" onClick={() => { setNewLeave({ ...newLeave, kind: 'work', type: 'full', session: 'AM', status: 'Approved', title: '', reason: '' }); setLeaveOpen(true) }} className="gap-2 rounded-xl glass-panel shadow-md hover:bg-white/10">
                      <ClipboardList className="size-4" />Add work
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1.5 rounded-xl text-xs font-semibold gap-1.5 border border-border/50">
                      <Eye className="size-3.5 text-indigo-400" /> View-Only Mode
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)} className="rounded-xl text-xs gap-1.5 glass-panel">
                      <ShieldCheck className="size-3.5 text-primary" /> Log in as Admin
                    </Button>
                  </div>
                )}
              </div>
            </header>
          )}
          <div className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
            <Button size="sm" variant={workspace === 'calendar' ? 'secondary' : 'outline'} className="rounded-xl" onClick={() => setWorkspace('calendar')}>Calendar</Button>
            <Button size="sm" variant={workspace === 'delivery' ? 'secondary' : 'outline'} className="rounded-xl" onClick={() => setWorkspace('delivery')}>Delivery modules</Button>
            <Button size="sm" variant={workspace === 'team' ? 'secondary' : 'outline'} className="rounded-xl" onClick={() => setWorkspace('team')}>Team members</Button>
          </div>
          {workspace === 'delivery' ? (
            <DeliveryWorkspace modules={filteredModules} search={moduleSearch} setSearch={setModuleSearch} onAdd={openNewModule} onEdit={editModule} onDelete={removeModule} isAdmin={isAdmin} />
          ) : workspace === 'team' ? (
            <TeamWorkspace members={members} leaveCount={leaves} onAdd={openNewMember} onEdit={editMember} onDelete={removeMember} isAdmin={isAdmin} />
          ) : (
            <>
              <section className="grid gap-5 sm:grid-cols-3">
                <Stat label="On leave today" value={todayLeaves.length} detail={`of ${members.length} team members`} icon={<Users className="size-5" />} />
                <Stat label="Upcoming this week" value={leaves.filter((l) => l.start >= today && dayDiff(today, l.start) <= 7).length} detail="leave entries" icon={<Clock3 className="size-5" />} />
                <Stat label="Total this month" value={monthLeaves.length} detail="leave entries" icon={<CalendarIcon />} />
              </section>
              <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <Card className="glass-panel overflow-hidden rounded-3xl border-white/20 shadow-2xl">
                  <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/50 bg-muted/20 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" className="size-8 rounded-xl glass-panel" onClick={() => goMonth(-1)} aria-label="Previous month"><ChevronLeft className="size-4" /></Button>
                      <Button variant="outline" size="icon" className="size-8 rounded-xl glass-panel" onClick={() => goMonth(1)} aria-label="Next month"><ChevronRight className="size-4" /></Button>
                      <div className="min-w-36">
                        <CardTitle className="text-lg font-bold">{monthNames[cursor.getMonth()]} <span className="font-normal text-muted-foreground">{cursor.getFullYear()}</span></CardTitle>
                      </div>
                    </div>
                    <Tabs value={view} onValueChange={setView}>
                      <TabsList className="glass-panel p-1 rounded-xl">
                        <TabsTrigger value="month" className="rounded-lg text-xs font-semibold">Month</TabsTrigger>
                        <TabsTrigger value="week" className="rounded-lg text-xs font-semibold">Week</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="min-w-[720px]">
                      <div className="grid grid-cols-7 border-b border-border/50 bg-muted/10">
                        {weekdays.map((day) => <div key={day} className="px-3 py-3 text-[11px] font-bold tracking-widest text-muted-foreground/80 text-center">{day}</div>)}
                      </div>
                      <motion.div key={`${cursor.getFullYear()}-${cursor.getMonth()}-${view}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="grid grid-cols-7">
                        {(view === 'week' ? days.slice(14, 21) : days).map((date) => {
                          const key = iso(date);
                          const inMonth = date.getMonth() === cursor.getMonth();
                          const entries = leavesFor(key);
                          return (
                            <motion.button
                              whileHover={{ y: -3, scale: 1.02, zIndex: 20 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                              onClick={() => setSelectedDate(key)}
                              key={key}
                              className={`min-h-28 border-b border-r border-border/40 p-2.5 text-left transition-colors relative ${!inMonth ? 'bg-muted/10 text-muted-foreground/40' : 'hover:bg-white/10 dark:hover:bg-white/5'}`}
                            >
                              <div className={`mb-2 flex size-7 items-center justify-center rounded-full text-xs font-bold transition-transform ${key === today ? 'bg-gradient-to-tr from-primary to-indigo-600 text-primary-foreground shadow-lg shadow-indigo-500/30 scale-110' : ''}`}>
                                {date.getDate()}
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {entries.map((entry) => {
                                  const m = memberMap[entry.memberId];
                                  if (!m) return null;
                                  return (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.85 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      whileHover={{ scale: 1.05 }}
                                      key={entry.id}
                                      className="flex items-center gap-1.5 truncate rounded-lg px-2 py-1 text-[11px] font-semibold shadow-sm border border-white/10 backdrop-blur-sm"
                                      style={{ color: m.color, backgroundColor: `${m.color}22` }}
                                    >
                                      <span className="size-2 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: m.color }} />
                                      <span className="truncate">{m.name.split(' ')[0]}{entry.type === 'half' && ` · ${entry.session}`}</span>
                                    </motion.div>
                                  )
                                })}
                              </div>
                            </motion.button>
                          )
                        })}
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex flex-col gap-6">
                  <Card className="glass-panel overflow-hidden rounded-3xl border-white/20 shadow-xl">
                    <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                      <CardTitle className="text-base font-bold">Today&apos;s schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3.5 p-5">
                      {todayLeaves.length ? todayLeaves.map((leave) => <MemberRow key={leave.id} member={memberMap[leave.memberId]} subtitle={leave.type === 'half' ? `${leave.session} · Half day` : 'Full day'} />) : <p className="text-xs font-medium text-muted-foreground/80">Everyone is in today.</p>}
                    </CardContent>
                  </Card>
                  <Card className="glass-panel overflow-hidden rounded-3xl border-white/20 shadow-xl">
                    <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                      <CardTitle className="text-base font-bold">Coming up</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 p-5">
                      {upcoming.map((leave) => {
                        const m = memberMap[leave.memberId];
                        if (!m) return null;
                        return (
                          <div key={leave.id} className="flex items-center gap-3.5 p-2 rounded-xl transition-colors hover:bg-white/5">
                            <div className="w-11 text-center py-1 rounded-xl glass-panel bg-primary/5 border border-primary/10">
                              <p className="text-[10px] font-bold uppercase text-primary">{monthNames[startOfDay(leave.start).getMonth()].slice(0, 3)}</p>
                              <p className="text-base font-bold tracking-tight">{startOfDay(leave.start).getDate()}</p>
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{m.name}</p>
                              <p className="text-xs text-muted-foreground/80">{leave.reason || 'Time away'} · <span className="font-medium text-primary">{leave.status}</span></p>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      <Dialog open={moduleOpen} onOpenChange={setModuleOpen}>
        <DialogContent className="max-w-2xl glass-panel border-white/20 rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingModule ? 'Edit delivery module' : 'Add delivery module'}</DialogTitle>
            <DialogDescription className="text-sm">Track the work planned for a delivery month.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2 mt-2">
            <Field label="Month">
              <Select value={moduleDraft.month} onValueChange={(v) => setModuleDraft({ ...moduleDraft, month: v })}>
                <SelectTrigger className="rounded-xl glass-panel"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-panel border-white/20 rounded-xl">
                  <SelectGroup>
                    <SelectItem value="August">August</SelectItem>
                    <SelectItem value="September">September</SelectItem>
                    <SelectItem value="October">October</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Phase / Milestone">
              <Input value={moduleDraft.phase} onChange={(e) => setModuleDraft({ ...moduleDraft, phase: e.target.value })} placeholder="e.g. M-2" className="rounded-xl glass-panel" />
            </Field>
          </div>
          <Field label="Module / Deliverable">
            <Input value={moduleDraft.module} onChange={(e) => setModuleDraft({ ...moduleDraft, module: e.target.value })} placeholder="Module name" className="rounded-xl glass-panel" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Total hours">
              <Input value={moduleDraft.hours} onChange={(e) => setModuleDraft({ ...moduleDraft, hours: e.target.value })} placeholder="Optional" className="rounded-xl glass-panel" />
            </Field>
            <Field label="Target completion">
              <Input value={moduleDraft.target} onChange={(e) => setModuleDraft({ ...moduleDraft, target: e.target.value })} className="rounded-xl glass-panel" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatusField label="Design status" value={moduleDraft.design} onChange={(v) => setModuleDraft({ ...moduleDraft, design: v as DeliveryModule['design'] })} />
            <StatusField label="Development status" value={moduleDraft.development} onChange={(v) => setModuleDraft({ ...moduleDraft, development: v as DeliveryModule['development'] })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dependencies">
              <Textarea value={moduleDraft.dependencies} onChange={(e) => setModuleDraft({ ...moduleDraft, dependencies: e.target.value })} rows={3} className="rounded-xl glass-panel" />
            </Field>
            <Field label="Questions">
              <Textarea value={moduleDraft.questions} onChange={(e) => setModuleDraft({ ...moduleDraft, questions: e.target.value })} rows={3} className="rounded-xl glass-panel" />
            </Field>
          </div>
          <Button onClick={saveModule} className="rounded-xl shadow-lg shadow-primary/25 mt-2">{editingModule ? 'Save changes' : 'Add module'}</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="glass-panel border-white/20 rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{newLeave.kind === 'work' ? 'Add calendar work' : 'Add leave'}</DialogTitle>
            <DialogDescription className="text-sm">{newLeave.kind === 'work' ? 'Schedule a task, milestone, meeting, or other important work.' : 'Log a new absence for your calendar.'}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <Field label="Team member">
              <Select value={newLeave.memberId} onValueChange={(v) => setNewLeave({ ...newLeave, memberId: v })}>
                <SelectTrigger className="rounded-xl glass-panel"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-panel border-white/20 rounded-xl">
                  <SelectGroup>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            {newLeave.kind === 'work' ? (
              <>
                <Field label="Work item title">
                  <Input value={newLeave.title} onChange={(e) => setNewLeave({ ...newLeave, title: e.target.value })} placeholder="e.g. Release planning meeting" className="rounded-xl glass-panel" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Start date"><Input type="date" value={newLeave.start} onChange={(e) => setNewLeave({ ...newLeave, start: e.target.value })} className="rounded-xl glass-panel" /></Field>
                  <Field label="End date"><Input type="date" value={newLeave.end} onChange={(e) => setNewLeave({ ...newLeave, end: e.target.value })} className="rounded-xl glass-panel" /></Field>
                </div>
                <Field label="Notes (optional)">
                  <Textarea value={newLeave.reason} onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })} placeholder="Add context, links, or an agenda" className="rounded-xl glass-panel" />
                </Field>
                <Button onClick={addLeave} className="rounded-xl shadow-lg shadow-primary/25 mt-2">Save work item</Button>
              </>
            ) : (
              <>
                <Field label="Leave type">
                  <Select value={newLeave.type} onValueChange={(v) => setNewLeave({ ...newLeave, type: v })}>
                    <SelectTrigger className="rounded-xl glass-panel"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-panel border-white/20 rounded-xl">
                      <SelectGroup>
                        <SelectItem value="full">Full day / Multiple days</SelectItem>
                        <SelectItem value="half">Half day</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Start date"><Input type="date" value={newLeave.start} onChange={(e) => setNewLeave({ ...newLeave, start: e.target.value })} className="rounded-xl glass-panel" /></Field>
                  {newLeave.type === 'full' && <Field label="End date"><Input type="date" value={newLeave.end} onChange={(e) => setNewLeave({ ...newLeave, end: e.target.value })} className="rounded-xl glass-panel" /></Field>}
                </div>
                {newLeave.type === 'half' && (
                  <Field label="Session">
                    <Select value={newLeave.session} onValueChange={(v) => setNewLeave({ ...newLeave, session: v })}>
                      <SelectTrigger className="rounded-xl glass-panel"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-panel border-white/20 rounded-xl">
                        <SelectGroup>
                          <SelectItem value="AM">Morning</SelectItem>
                          <SelectItem value="PM">Afternoon</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
                <Field label="Status">
                  <Select value={newLeave.status} onValueChange={(v) => setNewLeave({ ...newLeave, status: v })}>
                    <SelectTrigger className="rounded-xl glass-panel"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-panel border-white/20 rounded-xl">
                      <SelectGroup>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Reason (optional)">
                  <Textarea value={newLeave.reason} onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })} placeholder="e.g. Summer holiday" className="rounded-xl glass-panel" />
                </Field>
                <Button onClick={addLeave} className="rounded-xl shadow-lg shadow-primary/25 mt-2">Save leave</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent className="glass-panel border-white/20 rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingMember ? 'Edit team member' : 'Add team member'}</DialogTitle>
            <DialogDescription className="text-sm">{editingMember ? 'Update this person’s roster details.' : 'Add someone to your leave roster.'}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <Field label="Name"><Input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="e.g. Jamie Lee" className="rounded-xl glass-panel" /></Field>
            <Field label="Role"><Input value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} placeholder="e.g. Designer" className="rounded-xl glass-panel" /></Field>
            <Field label="Member color"><Input type="color" value={newMember.color} onChange={(e) => setNewMember({ ...newMember, color: e.target.value })} className="h-11 p-1.5 rounded-xl glass-panel cursor-pointer" /></Field>
            <Field label="Profile photo">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 ring-2 ring-primary/30" style={{ backgroundColor: `${newMember.color}22`, color: newMember.color }}>
                  {newMember.avatar && <AvatarImage src={newMember.avatar} alt="Profile preview" />}
                  <AvatarFallback className="font-bold">{newMember.name ? newMember.name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase() : <ImageIcon className="size-5" />}</AvatarFallback>
                </Avatar>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 glass-panel px-3.5 py-2 text-sm font-medium transition-transform hover:scale-105">
                  <Upload className="size-4" />Upload
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
                </label>
                {newMember.avatar && <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => setNewMember({ ...newMember, avatar: '' })}>Remove</Button>}
              </div>
            </Field>
            <Button onClick={addMember} className="rounded-xl shadow-lg shadow-primary/25 mt-2">{editingMember ? 'Save changes' : 'Add member'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <AnimatePresence>
        {selectedDate && (
          <motion.aside
            initial={{ x: 450, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 450, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm glass-panel border-l border-white/20 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Calendar details</p>
                <h2 className="mt-1 text-2xl font-bold">{startOfDay(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h2>
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setSelectedDate(null)} aria-label="Close details"><X className="size-5" /></Button>
            </div>
            <div className="mt-8 flex flex-col gap-5">
              {selectedLeaves.length ? selectedLeaves.map((leave) => {
                const m = memberMap[leave.memberId];
                if (!m) return null;
                return (
                  <div key={leave.id} className="rounded-2xl glass-panel border-white/20 p-4 shadow-md">
                    <MemberRow member={m} subtitle={leave.kind === 'work' ? 'Work item' : leave.type === 'half' ? `Half day · ${leave.session}` : `${leave.status} · Full day`} />
                    <p className="mt-4 text-xs text-muted-foreground leading-relaxed">{leave.reason || 'No reason provided.'}</p>
                    {isAdmin && (
                      <Button variant="ghost" size="sm" className="mt-3 gap-2 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => { setLeaves(leaves.filter((x) => x.id !== leave.id)); setSelectedDate(null) }}>
                        <Trash2 className="size-4" />Delete leave
                      </Button>
                    )}
                  </div>
                )
              }) : <p className="text-sm text-muted-foreground">No leave recorded for this day.</p>}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="glass-panel border-white/20 rounded-3xl shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" /> Admin Login Required
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter admin email & password credentials to unlock full add, edit, and delete permissions.
            </DialogDescription>
          </DialogHeader>
          {authError && (
            <div className="rounded-xl bg-destructive/15 p-3 text-xs text-destructive font-medium border border-destructive/20">
              {authError}
            </div>
          )}
          <form onSubmit={handleLogin} className="flex flex-col gap-3.5 mt-2">
            <Field label="Admin Email">
              <Input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="e.g. admin@gmail.com" className="rounded-xl glass-panel" />
            </Field>
            <Field label="Password">
              <Input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="••••••••" className="rounded-xl glass-panel" />
            </Field>
            <Button type="submit" className="rounded-xl shadow-lg shadow-primary/25 mt-2 font-semibold">Sign In as Admin</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DeliveryWorkspace({ modules, search, setSearch, onAdd, onEdit, onDelete, isAdmin }: { modules: DeliveryModule[]; search: string; setSearch: (value: string) => void; onAdd: (month?: string) => void; onEdit: (item: DeliveryModule) => void; onDelete: (id: string) => void; isAdmin: boolean }) {
  const grouped = ['August', 'September', 'October'].map((month) => ({ month, items: modules.filter((item) => item.month === month) })).filter((group) => group.items.length)
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Delivery planning</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">Delivery modules</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Plan every module by month and keep design, development, and dependencies visible.</p>
        </div>
        {isAdmin && <Button onClick={() => onAdd()} className="gap-2 rounded-xl shadow-lg shadow-primary/25"><Plus className="size-4" />Add module</Button>}
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search modules, milestones, or targets" className="pl-10 h-10 rounded-xl glass-panel" />
      </div>
      {grouped.map(({ month, items }) => (
        <Card key={month} className="glass-panel overflow-hidden rounded-3xl border-white/20 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20 px-6 py-4">
            <div>
              <CardTitle className="text-lg font-bold">{month}</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">{items.length} planned deliverables</p>
            </div>
            {isAdmin && <Button variant="outline" size="sm" className="rounded-xl glass-panel" onClick={() => onAdd(month)}>Add to {month}</Button>}
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr className="border-b border-primary/30 bg-gradient-to-r from-primary/20 via-indigo-500/20 to-primary/15 text-left text-xs font-bold uppercase tracking-wider text-primary">
                    <th className="p-4 pl-6">Phase / milestone</th>
                    <th className="p-4">Module / deliverable</th>
                    <th className="p-4">Hours</th>
                    <th className="p-4">Design</th>
                    <th className="p-4">Development</th>
                    <th className="p-4">Target</th>
                    <th className="p-4">Dependencies</th>
                    <th className="p-4">Questions</th>
                    {isAdmin && <th className="p-4 pr-6" />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/30 last:border-0 align-top transition-colors hover:bg-white/5">
                      <td className="p-4 pl-6 font-semibold text-xs text-primary">{item.phase}</td>
                      <td className="max-w-56 p-4 font-semibold">{item.module}</td>
                      <td className="p-4 text-xs font-mono">{item.hours || '—'}</td>
                      <td className="p-4"><StatusBadge status={item.design} /></td>
                      <td className="p-4"><StatusBadge status={item.development} /></td>
                      <td className="p-4 text-xs font-medium">{item.target}</td>
                      <td className="max-w-48 whitespace-pre-line p-4 text-xs text-muted-foreground/90">{item.dependencies || '—'}</td>
                      <td className="max-w-56 whitespace-pre-line p-4 text-xs text-muted-foreground/90">{item.questions || '—'}</td>
                      {isAdmin && (
                        <td className="p-4 pr-6">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => onEdit(item)} aria-label="Edit module"><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={() => onDelete(item.id)} aria-label="Delete module"><Trash2 className="size-4" /></Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 p-4 lg:hidden">
              {items.map((item) => (
                <motion.div key={item.id} whileHover={{ scale: 1.01 }} className="rounded-2xl border border-border/60 glass-panel p-4 shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-primary">{item.phase}</p>
                      <h3 className="mt-1 font-bold">{item.module}</h3>
                    </div>
                    {isAdmin && (
                      <div className="flex">
                        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => onEdit(item)} aria-label="Edit module"><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon" className="rounded-xl text-destructive" onClick={() => onDelete(item.id)} aria-label="Delete module"><Trash2 className="size-4" /></Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge status={item.design} />
                    <StatusBadge status={item.development} />
                    <Badge variant="outline" className="rounded-lg">{item.target}</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                    <div><p className="text-muted-foreground">Hours</p><p className="font-semibold">{item.hours || '—'}</p></div>
                    <div><p className="text-muted-foreground">Dependencies</p><p className="whitespace-pre-line">{item.dependencies || '—'}</p></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className="rounded-lg font-semibold shadow-xs" variant={status === 'Completed' ? 'default' : status === 'In Progress' ? 'secondary' : 'outline'}>
      {status}
    </Badge>
  )
}

function TeamWorkspace({ members, leaveCount, onAdd, onEdit, onDelete, isAdmin }: { members: Member[]; leaveCount: Leave[]; onAdd: () => void; onEdit: (member: Member) => void; onDelete: (id: string) => void; isAdmin: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Your roster</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">Team members</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Manage the people who appear in your leave calendar.</p>
        </div>
        {isAdmin && <Button onClick={onAdd} className="gap-2 rounded-xl shadow-lg shadow-primary/25"><Plus className="size-4" />Add member</Button>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => {
          const entries = leaveCount.filter((leave) => leave.memberId === member.id).length;
          return (
            <motion.div
              key={member.id}
              whileHover={{ y: -8, rotateX: 4, rotateY: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="perspective-1000"
            >
              <Card className="glass-panel glass-card-hover overflow-hidden rounded-3xl border-white/20 p-5 shadow-xl preserve-3d">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between gap-3">
                    <Avatar className="size-14 ring-2 ring-primary/30 shadow-md translate-z-20" style={{ backgroundColor: `${member.color}22`, color: member.color }}>
                      {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                      <AvatarFallback className="font-bold text-base">{member.initials}</AvatarFallback>
                    </Avatar>
                    {isAdmin && (
                      <div className="flex gap-1 translate-z-10">
                        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => onEdit(member)} aria-label={`Edit ${member.name}`}><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={() => onDelete(member.id)} aria-label={`Remove ${member.name}`}><Trash2 className="size-4" /></Button>
                      </div>
                    )}
                  </div>
                  <div className="translate-z-10">
                    <h3 className="mt-4 text-base font-bold tracking-tight">{member.name}</h3>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">{member.role || 'No role assigned'}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                      <span>Calendar roster</span>
                      <Badge variant="secondary" className="font-bold rounded-lg">{entries} {entries === 1 ? 'entry' : 'entries'}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
      {!members.length && (
        <Card className="glass-panel rounded-3xl p-8 text-center"><CardContent className="p-0"><p className="font-semibold">No team members yet</p><p className="mt-1 text-sm text-muted-foreground">Add your first team member to start planning leave.</p></CardContent></Card>
      )}
    </div>
  )
}

function StatusField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={(next) => { if (next) onChange(next) }}>
        <SelectTrigger className="rounded-xl glass-panel"><SelectValue /></SelectTrigger>
        <SelectContent className="glass-panel border-white/20 rounded-xl">
          <SelectGroup>{['Planned','In Progress','Completed','Pending'].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

function Stat({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -6, rotateX: 4, rotateY: -3, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="perspective-1000"
    >
      <Card className="glass-panel glass-card-hover overflow-hidden rounded-3xl border-white/20 p-5 shadow-xl preserve-3d">
        <CardContent className="p-0 flex items-center justify-between">
          <div className="translate-z-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground/80">{detail}</p>
          </div>
          <div className="translate-z-20 rounded-2xl bg-gradient-to-tr from-primary/20 to-indigo-500/20 p-3 text-primary shadow-inner border border-primary/20 backdrop-blur-md">
            {icon}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MemberRow({ member, subtitle }: { member: Member; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-9 ring-1 ring-primary/20 shadow-sm" style={{ backgroundColor: `${member.color}22`, color: member.color }}>
        <AvatarFallback className="font-bold text-xs">{member.initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground/80">{subtitle}</p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><Label className="text-xs font-semibold">{label}</Label>{children}</div>
}

function CalendarIcon() {
  return <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
}

function SelectGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
