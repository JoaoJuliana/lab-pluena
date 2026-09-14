'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  LogOut, Search, Download, Flame, Sun, Circle, Users, Sparkles, FileText,
  CheckCircle2, X, StickyNote, Building2, Mail, Phone, Globe, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LEAD_STATUSES, TOOL_LABELS } from '@/lib/pluena'

const PRIORITY_STYLE = {
  Hot: { icon: Flame, cls: 'bg-accent/15 text-accent border-accent/30' },
  Warm: { icon: Sun, cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  Standard: { icon: Circle, cls: 'bg-secondary text-muted-foreground border-border' },
}
const STATUS_STYLE = {
  'Novo': 'bg-primary/12 text-primary',
  'Cliente': 'bg-green-100 text-green-700',
  'Proposta enviada': 'bg-blue-100 text-blue-700',
  'Sem interesse': 'bg-red-50 text-red-600',
  'Arquivado': 'bg-secondary text-muted-foreground',
}

function api(path, options = {}) {
  return fetch(`/api${path}`, { credentials: 'include', ...options })
}

function Login({ onOk }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      const res = await api('/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro'); return }
      onOk(data.user)
    } catch { toast.error('Erro de ligação') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-grain px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <span className="inline-flex items-baseline gap-1.5 font-display">
            <span className="text-xl font-semibold text-foreground">PLUENA</span>
            <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-foreground">Admin</span>
          </span>
          <p className="mt-2 text-sm text-muted-foreground">Acesso reservado à equipa PLUENA</p>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="geral@pluena.pt" onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
          <div>
            <Label className="mb-1.5 block">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
          <Button className="w-full" onClick={submit} disabled={loading}>{loading ? 'A entrar…' : 'Entrar'}</Button>
        </div>
      </Card>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><span className="text-sm">{label}</span></div>
      <p className="mt-2 font-display text-3xl text-foreground">{value}</p>
    </Card>
  )
}

function LeadDetail({ lead, onClose, onUpdate }) {
  const [note, setNote] = useState('')
  const [status, setStatus] = useState(lead.status)
  const [saving, setSaving] = useState(false)

  const patch = async (body) => {
    setSaving(true)
    try {
      const res = await api(`/leads/${lead.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro'); return }
      onUpdate(data)
      if (body.note) setNote('')
      toast.success('Atualizado')
    } catch { toast.error('Erro') } finally { setSaving(false) }
  }

  const Row = ({ icon: Icon, label, value }) => value ? (
    <div className="flex items-start gap-2 text-sm"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span className="text-muted-foreground">{label}:</span><span className="text-foreground">{value}</span></div>
  ) : null

  const cfg = lead.projectConfig || {}
  const calc = lead.calculator || {}

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{lead.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={PRIORITY_STYLE[lead.priority]?.cls}>{lead.priority}</Badge>
            <Badge variant="outline">{TOOL_LABELS[lead.tool] || lead.tool}</Badge>
            {typeof lead.score === 'number' && <Badge variant="outline">Score {lead.score}</Badge>}
          </div>

          <div className="grid gap-1.5 rounded-lg border border-border bg-secondary/30 p-4">
            <Row icon={Building2} label="Empresa" value={lead.company} />
            <Row icon={Mail} label="Email" value={lead.email} />
            <Row icon={Phone} label="Telefone" value={lead.phone} />
            <Row icon={Globe} label="Website" value={lead.website} />
            <Row icon={Sparkles} label="Setor" value={lead.businessCategory} />
          </div>

          {lead.topOpportunities?.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Principais oportunidades</p>
              <ul className="space-y-1.5">
                {lead.topOpportunities.map((o, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent">{o.impact}</span>
                    {o.title || o.category}
                  </li>
                ))}
              </ul>
              {lead.hiddenOpportunityCount > 0 && <p className="mt-1 text-xs text-muted-foreground">+{lead.hiddenOpportunityCount} oportunidades ocultas</p>}
            </div>
          )}

          {Object.keys(calc).length > 0 && (
            <div className="rounded-lg border border-border p-4 text-sm">
              <p className="mb-2 font-medium text-foreground">Simulação de reservas</p>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <span>Receita plataformas: €{(calc.platformRevenue || 0).toLocaleString('pt-PT')}</span>
                <span>Comissões: €{(calc.commissionCost || 0).toLocaleString('pt-PT')}</span>
                <span>Meta direta: {calc.targetDirect}%</span>
                <span>Redução potencial: €{(calc.potentialCommissionReduction || 0).toLocaleString('pt-PT')}</span>
              </div>
            </div>
          )}

          {(cfg.goals?.length || cfg.features?.length) && (
            <div className="rounded-lg border border-border p-4 text-sm">
              <p className="mb-2 font-medium text-foreground">Configuração do projeto</p>
              {cfg.goals?.length > 0 && <p className="text-muted-foreground"><b>Objetivos:</b> {cfg.goals.join(', ')}</p>}
              {cfg.features?.length > 0 && <p className="mt-1 text-muted-foreground"><b>Funcionalidades:</b> {cfg.features.join(', ')}</p>}
              {cfg.timeline && <p className="mt-1 text-muted-foreground"><b>Prazo:</b> {cfg.timeline}</p>}
              {cfg.budget && <p className="mt-1 text-muted-foreground"><b>Investimento:</b> {cfg.budget}</p>}
            </div>
          )}

          {lead.message && <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground"><b className="text-foreground">Mensagem:</b> {lead.message}</div>}

          <div>
            <Label className="mb-1.5 block">Estado</Label>
            <div className="flex gap-2">
              <Select value={status} onValueChange={(v) => { setStatus(v); patch({ status: v }) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Notas internas</Label>
            {lead.notes?.length > 0 && (
              <div className="mb-3 space-y-2">
                {lead.notes.map((n) => (
                  <div key={n.id} className="rounded-lg bg-secondary/50 p-3 text-sm">
                    <p className="text-foreground">{n.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{n.by} · {new Date(n.at).toLocaleString('pt-PT')}</p>
                  </div>
                ))}
              </div>
            )}
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Adicionar nota…" />
            <Button size="sm" className="mt-2" disabled={saving || !note.trim()} onClick={() => patch({ note })}>
              <StickyNote className="mr-2 h-4 w-4" /> Guardar nota
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Dashboard({ user, onLogout }) {
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTool, setFilterTool] = useState('all')
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [l, s] = await Promise.all([api('/leads'), api('/stats')])
      if (l.status === 401) { onLogout(); return }
      setLeads(await l.json())
      setStats(await s.json())
    } catch { toast.error('Erro ao carregar') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const logout = async () => { await api('/auth/logout', { method: 'POST' }); onLogout() }

  const filtered = leads.filter((l) => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false
    if (filterTool !== 'all' && l.tool !== filterTool) return false
    if (search) {
      const q = search.toLowerCase()
      return [l.name, l.company, l.email, l.phone].some((v) => (v || '').toLowerCase().includes(q))
    }
    return true
  })

  const updateLead = (updated) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setSelected(updated)
    load()
  }

  return (
    <div className="min-h-screen bg-background bg-grain">
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <span className="inline-flex items-baseline gap-1.5 font-display">
            <span className="text-xl font-semibold text-foreground">PLUENA</span>
            <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-foreground">Admin</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:block">{user.email}</span>
            <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sair</Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
            <StatCard icon={Users} label="Total Leads" value={stats.total} />
            <StatCard icon={Sparkles} label="Novos" value={stats.novos} />
            <StatCard icon={FileText} label="Propostas" value={stats.propostas} />
            <StatCard icon={CheckCircle2} label="Clientes" value={stats.clientes} />
            <StatCard icon={Circle} label="Ferramenta +usada" value={TOOL_LABELS[stats.mostUsedTool] || '—'} />
            <StatCard icon={CheckCircle2} label="Conversão" value={`${stats.conversionRate}%`} />
          </div>
        )}

        <Card className="p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar nome, empresa, email…" className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="sm:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos os estados</SelectItem>{LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterTool} onValueChange={setFilterTool}>
              <SelectTrigger className="sm:w-44"><SelectValue placeholder="Ferramenta" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas</SelectItem>{Object.entries(TOOL_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <a href="/api/leads/export" target="_blank" rel="noreferrer"><Button variant="outline" className="w-full sm:w-auto"><Download className="mr-2 h-4 w-4" />CSV</Button></a>
          </div>

          {loading ? (
            <div className="py-16 text-center text-muted-foreground">A carregar…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">Sem leads {leads.length ? 'com estes filtros' : 'ainda'}.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">Data</th>
                    <th className="py-3 pr-4 font-medium">Nome</th>
                    <th className="hidden py-3 pr-4 font-medium sm:table-cell">Empresa</th>
                    <th className="hidden py-3 pr-4 font-medium md:table-cell">Ferramenta</th>
                    <th className="py-3 pr-4 font-medium">Prioridade</th>
                    <th className="py-3 pr-4 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => {
                    const P = PRIORITY_STYLE[l.priority] || PRIORITY_STYLE.Standard
                    return (
                      <tr key={l.id} onClick={() => setSelected(l)} className="cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary/40">
                        <td className="py-3 pr-4 text-muted-foreground">{new Date(l.createdAt).toLocaleDateString('pt-PT')}</td>
                        <td className="py-3 pr-4"><div className="font-medium text-foreground">{l.name}</div><div className="text-xs text-muted-foreground">{l.email}</div></td>
                        <td className="hidden py-3 pr-4 text-muted-foreground sm:table-cell">{l.company || '—'}</td>
                        <td className="hidden py-3 pr-4 text-muted-foreground md:table-cell">{TOOL_LABELS[l.tool] || l.tool}</td>
                        <td className="py-3 pr-4"><Badge variant="outline" className={P.cls}><P.icon className="mr-1 h-3 w-3" />{l.priority}</Badge></td>
                        <td className="py-3 pr-4"><span className={`inline-block rounded-full px-2.5 py-1 text-xs ${STATUS_STYLE[l.status] || 'bg-secondary text-muted-foreground'}`}>{l.status}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {selected && <LeadDetail lead={selected} onClose={() => setSelected(null)} onUpdate={updateLead} />}
    </div>
  )
}

function AdminApp() {
  const [user, setUser] = useState(undefined) // undefined=loading, null=logged out
  useEffect(() => {
    api('/auth/me').then(async (r) => {
      if (r.ok) { const d = await r.json(); setUser(d.user) } else setUser(null)
    }).catch(() => setUser(null))
  }, [])

  if (user === undefined) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">A carregar…</div>
  if (!user) return <Login onOk={setUser} />
  return <Dashboard user={user} onLogout={() => setUser(null)} />
}

export default AdminApp
