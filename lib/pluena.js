// PLUENA Lab — shared data & scoring logic (pure JS, no side effects)

export const BUSINESS_TYPES = [
  'Alojamento Local / Turismo Rural',
  'Cl\u00ednica / Sa\u00fade',
  'Est\u00e9tica / Bem-estar',
  'Autom\u00f3vel',
  'Restaurante / Caf\u00e9',
  'Com\u00e9rcio / Loja',
  'Servi\u00e7os Profissionais',
  'Imobili\u00e1rio',
  'Constru\u00e7\u00e3o',
  'Outro',
]

// ---------------- Digital Check ----------------
export const DIGITAL_QUESTIONS = [
  { id: 'q1', text: 'Tem website pr\u00f3prio?', category: 'Presen\u00e7a Digital' },
  { id: 'q2', text: 'O website est\u00e1 adaptado a telem\u00f3vel?', category: 'Presen\u00e7a Digital' },
  { id: 'q3', text: 'Os clientes conseguem marcar, reservar ou pedir or\u00e7amento diretamente?', category: 'Convers\u00e3o' },
  { id: 'q4', text: 'Consegue medir pedidos de contacto ou convers\u00f5es?', category: 'Convers\u00e3o' },
  { id: 'q5', text: 'Os contactos e pedidos ficam organizados?', category: 'Experi\u00eancia do Cliente' },
  { id: 'q6', text: 'Utiliza alguma ferramenta de acompanhamento de clientes?', category: 'Experi\u00eancia do Cliente' },
  { id: 'q7', text: 'Tem formul\u00e1rios ou emails automatizados?', category: 'Automatiza\u00e7\u00e3o' },
  { id: 'q8', text: 'Existem processos comerciais que ainda faz manualmente?', category: 'Automatiza\u00e7\u00e3o', invert: true },
  { id: 'q9', text: 'Tem o Google Business Profile atualizado?', category: 'SEO / Descoberta' },
  { id: 'q10', text: 'Tem alguma estrat\u00e9gia de presen\u00e7a em pesquisas (SEO)?', category: 'SEO / Descoberta' },
  { id: 'q11', text: 'Sabe de onde chegam os seus clientes?', category: 'Dados / M\u00e9tricas' },
]

export const DIGITAL_CATEGORIES = [
  'Presen\u00e7a Digital', 'Convers\u00e3o', 'Experi\u00eancia do Cliente',
  'Automatiza\u00e7\u00e3o', 'SEO / Descoberta', 'Dados / M\u00e9tricas',
]

const CATEGORY_COPY = {
  'Convers\u00e3o': 'Existem visitantes interessados que podem n\u00e3o encontrar um caminho claro para avan\u00e7ar.',
  'Automatiza\u00e7\u00e3o': 'Parte do processo comercial ainda depende demasiado de tarefas manuais.',
  'Presen\u00e7a Digital': 'A presen\u00e7a online do neg\u00f3cio pode estar a limitar o n\u00famero de novos clientes.',
  'SEO / Descoberta': 'O neg\u00f3cio pode aumentar a sua visibilidade em pesquisas relevantes.',
  'Experi\u00eancia do Cliente': 'A rela\u00e7\u00e3o com os clientes pode ser acompanhada de forma mais estruturada.',
  'Dados / M\u00e9tricas': 'Sem dados claros, torna-se dif\u00edcil saber onde investir para crescer.',
}

function valueFor(answer, invert) {
  let v = answer === 'sim' ? 1 : answer === 'parcial' ? 0.5 : 0
  if (invert) v = 1 - v
  return v
}

export function computeDigitalResult(answers) {
  const catTotals = {}
  const catCounts = {}
  let opportunityCount = 0
  DIGITAL_QUESTIONS.forEach((q) => {
    const a = answers[q.id] || 'nao'
    const v = valueFor(a, q.invert)
    catTotals[q.category] = (catTotals[q.category] || 0) + v
    catCounts[q.category] = (catCounts[q.category] || 0) + 1
    if (v < 1) opportunityCount += 1
  })
  const catScores = DIGITAL_CATEGORIES.map((c) => ({
    category: c,
    score: catCounts[c] ? catTotals[c] / catCounts[c] : 0,
  }))
  const overall = Math.round(
    (catScores.reduce((a, c) => a + c.score, 0) / catScores.length) * 100
  )
  const gaps = catScores
    .map((c) => ({ ...c, gap: 1 - c.score }))
    .filter((c) => c.gap > 0.01)
    .sort((a, b) => b.gap - a.gap)

  const priorityOf = (gap) => (gap >= 0.6 ? 'Alta' : gap >= 0.3 ? 'M\u00e9dia' : 'Baixa')
  const revealed = gaps.slice(0, 3).map((c) => ({
    category: c.category,
    impact: priorityOf(c.gap),
    explanation: CATEGORY_COPY[c.category],
  }))
  const lockedCategories = gaps.slice(3).map((c) => c.category)

  let interpretation
  if (overall >= 75) interpretation = 'Tem uma presen\u00e7a digital s\u00f3lida. Mesmo assim, identific\u00e1mos margens de evolu\u00e7\u00e3o relevantes.'
  else if (overall >= 50) interpretation = 'Tem uma boa base digital, mas identific\u00e1mos oportunidades importantes de crescimento.'
  else interpretation = 'Existe um potencial digital significativo por explorar no seu neg\u00f3cio.'

  return {
    score: overall,
    interpretation,
    opportunityCount: Math.max(opportunityCount, revealed.length + lockedCategories.length),
    revealed,
    lockedCategories,
    catScores,
  }
}

// ---------------- Project Builder ----------------
export const PROJECT_GOALS = [
  'Ter uma presen\u00e7a profissional online',
  'Conseguir mais clientes',
  'Receber reservas',
  'Receber marca\u00e7\u00f5es',
  'Vender online',
  'Automatizar processos',
  'Melhorar um website existente',
  'Criar uma aplica\u00e7\u00e3o',
  'Melhorar Google / SEO',
  'Organizar contactos e pedidos',
  'Outro',
]

export const PROJECT_FEATURES = [
  'Website', 'Landing Page', 'Reservas Online', 'Marca\u00e7\u00f5es', 'Pagamentos Online',
  'Loja Online', 'WhatsApp', 'Formul\u00e1rios Inteligentes', 'Emails Autom\u00e1ticos', 'CRM',
  '\u00c1rea de Cliente', 'Dashboard', 'Multilingue', 'SEO', 'Google Business',
  'Analytics', 'Assistente IA', 'Automatiza\u00e7\u00f5es', 'Aplica\u00e7\u00e3o Web',
]

export const PROJECT_ASSETS = ['Dom\u00ednio', 'Website', 'Identidade visual', 'Redes sociais', 'Google Business']
export const PROJECT_TIMELINES = ['Assim que poss\u00edvel', 'Pr\u00f3ximo m\u00eas', '1\u20133 meses', 'Ainda estou a avaliar']
export const PROJECT_BUDGETS = ['Ainda n\u00e3o sei', 'At\u00e9 \u20ac500', '\u20ac500\u2013\u20ac1,000', '\u20ac1,000\u2013\u20ac2,500', '\u20ac2,500+', 'Quero discutir primeiro']

export function recommendProjectSolution(config) {
  const f = new Set(config.features || [])
  const g = new Set(config.goals || [])
  const modules = []
  const add = (m) => { if (!modules.includes(m)) modules.push(m) }

  if (f.has('Website') || g.has('Ter uma presen\u00e7a profissional online') || g.has('Melhorar um website existente')) add('Website Profissional')
  if (f.has('Landing Page')) add('Landing Page de Convers\u00e3o')
  if (f.has('Reservas Online') || g.has('Receber reservas')) add('Sistema de Reservas')
  if (f.has('Marca\u00e7\u00f5es') || g.has('Receber marca\u00e7\u00f5es')) add('Sistema de Marca\u00e7\u00f5es')
  if (f.has('Loja Online') || g.has('Vender online') || f.has('Pagamentos Online')) add('Loja / Pagamentos Online')
  if (f.has('SEO') || f.has('Google Business') || g.has('Melhorar Google / SEO')) add('SEO Local')
  if (f.has('Automatiza\u00e7\u00f5es') || f.has('Emails Autom\u00e1ticos') || g.has('Automatizar processos')) add('Automa\u00e7\u00e3o de Contactos')
  if (f.has('CRM') || f.has('Formul\u00e1rios Inteligentes') || g.has('Organizar contactos e pedidos')) add('Organiza\u00e7\u00e3o de Leads')
  if (f.has('Aplica\u00e7\u00e3o Web') || g.has('Criar uma aplica\u00e7\u00e3o')) add('Aplica\u00e7\u00e3o Web')
  if (f.has('Assistente IA')) add('Assistente Inteligente')

  if (modules.length === 0) add('Presen\u00e7a Digital Profissional')

  return {
    modules: modules.slice(0, 5),
    explanation:
      'Com base nas suas escolhas, esta combina\u00e7\u00e3o de solu\u00e7\u00f5es responde diretamente aos objetivos que indicou. \u00c9 um ponto de partida estrat\u00e9gico \u2014 a PLUENA prepara a abordagem certa para o seu contexto.',
  }
}

// ---------------- Transform sectors ----------------
export const SECTOR_KEYS = ['Alojamento', 'Cl\u00ednica', 'Est\u00e9tica', 'Autom\u00f3vel', 'Restaurante', 'Com\u00e9rcio', 'Servi\u00e7os', 'Imobili\u00e1rio', 'Outro']

export const SECTOR_TRANSFORM = {
  Alojamento: {
    antes: ['Depend\u00eancia de Booking / Airbnb', 'Pedidos manuais', 'Sem canal direto', 'Pouco controlo sobre os dados do h\u00f3spede', 'Comunica\u00e7\u00e3o dispersa'],
    pluena: ['Website pr\u00f3prio', 'Reservas diretas', 'Pagamentos', 'Automatiza\u00e7\u00e3o', 'Dados organizados', 'Google / SEO', 'Analytics'],
    depois: ['Maior controlo', 'Rela\u00e7\u00e3o direta com h\u00f3spedes', 'Marca mais forte', 'Processos mais organizados', 'Menor depend\u00eancia de intermedi\u00e1rios'],
  },
  'Cl\u00ednica': {
    antes: ['Marca\u00e7\u00f5es por telefone', 'Agenda dispersa', 'Faltas frequentes', 'Pouca presen\u00e7a online', 'Sem seguimento de pacientes'],
    pluena: ['Marca\u00e7\u00f5es online', 'Lembretes autom\u00e1ticos', 'Website profissional', 'Google / SEO', 'Organiza\u00e7\u00e3o de contactos'],
    depois: ['Agenda mais preenchida', 'Menos faltas', 'Experi\u00eancia mais profissional', 'Rela\u00e7\u00e3o cont\u00ednua com pacientes'],
  },
  'Est\u00e9tica': {
    antes: ['Marca\u00e7\u00f5es por mensagem', 'Sem hist\u00f3rico de clientes', 'Divulga\u00e7\u00e3o s\u00f3 nas redes sociais', 'Pouca fideliza\u00e7\u00e3o'],
    pluena: ['Marca\u00e7\u00f5es online', 'Ficha de cliente', 'Website + Google', 'Campanhas e lembretes', 'Automatiza\u00e7\u00e3o'],
    depois: ['Mais marca\u00e7\u00f5es', 'Clientes mais fi\u00e9is', 'Marca mais forte', 'Menos tempo em tarefas manuais'],
  },
  'Autom\u00f3vel': {
    antes: ['Pedidos de or\u00e7amento por telefone', 'Sem organiza\u00e7\u00e3o de leads', 'Pouca presen\u00e7a online', 'Stock desatualizado'],
    pluena: ['Website com cat\u00e1logo', 'Pedidos de or\u00e7amento online', 'Organiza\u00e7\u00e3o de leads', 'Google / SEO', 'Automatiza\u00e7\u00e3o'],
    depois: ['Mais pedidos qualificados', 'Processo comercial organizado', 'Maior visibilidade', 'Resposta mais r\u00e1pida'],
  },
  Restaurante: {
    antes: ['Reservas por telefone', 'Menu desatualizado online', 'Depend\u00eancia de plataformas de entrega', 'Pouca rela\u00e7\u00e3o com clientes'],
    pluena: ['Reservas online', 'Menu digital', 'Website + Google', 'Pedidos diretos', 'Automatiza\u00e7\u00e3o'],
    depois: ['Mais reservas diretas', 'Menor depend\u00eancia de intermedi\u00e1rios', 'Marca mais forte', 'Clientes recorrentes'],
  },
  'Com\u00e9rcio': {
    antes: ['Vendas s\u00f3 na loja f\u00edsica', 'Sem loja online', 'Pouca presen\u00e7a digital', 'Sem base de clientes'],
    pluena: ['Loja online', 'Pagamentos', 'Website + Google', 'Emails autom\u00e1ticos', 'Analytics'],
    depois: ['Novo canal de vendas', 'Alcance para al\u00e9m da loja f\u00edsica', 'Clientes recorrentes', 'Decis\u00f5es com base em dados'],
  },
  'Servi\u00e7os': {
    antes: ['Pedidos dispersos', 'Sem website ou desatualizado', 'Processos manuais', 'Pouca visibilidade'],
    pluena: ['Website profissional', 'Formul\u00e1rios inteligentes', 'Automatiza\u00e7\u00e3o', 'SEO Local', 'Organiza\u00e7\u00e3o de leads'],
    depois: ['Mais pedidos qualificados', 'Imagem mais profissional', 'Menos tempo em tarefas manuais', 'Crescimento sustentado'],
  },
  'Imobili\u00e1rio': {
    antes: ['Im\u00f3veis dispersos por portais', 'Sem website pr\u00f3prio forte', 'Leads desorganizadas', 'Pouca diferencia\u00e7\u00e3o'],
    pluena: ['Website com im\u00f3veis', 'Pedidos de visita online', 'CRM de leads', 'SEO + Google', 'Automatiza\u00e7\u00e3o'],
    depois: ['Marca mais forte', 'Leads organizadas', 'Menos depend\u00eancia de portais', 'Processo comercial claro'],
  },
  Outro: {
    antes: ['Presen\u00e7a digital limitada', 'Processos manuais', 'Pedidos desorganizados', 'Pouca visibilidade'],
    pluena: ['Presen\u00e7a digital profissional', 'Automatiza\u00e7\u00e3o', 'SEO / Google', 'Organiza\u00e7\u00e3o de contactos', 'Analytics'],
    depois: ['Mais oportunidades', 'Processos organizados', 'Marca mais forte', 'Crescimento sustentado'],
  },
}

export const TOOL_LABELS = {
  'digital-check': 'Digital Check',
  'website-check': 'Website Check',
  'booking': 'Reservas Diretas',
  'project-builder': 'Project Builder',
  'transform': 'Transformar o Meu Neg\u00f3cio',
}

export const LEAD_STATUSES = ['Novo', 'Por analisar', 'Contactado', 'Reuni\u00e3o marcada', 'Proposta enviada', 'Cliente', 'Sem interesse', 'Arquivado']

export function eur(n) {
  return '\u20ac' + Math.round(n).toLocaleString('pt-PT')
}
