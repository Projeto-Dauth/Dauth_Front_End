import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import logo from '@/logo-dauth-agendamentos.png'
import Icon from '@/components/ui/Icons'
import useAuthStore from '@/store/authStore'

import adminIndex from '@/content/docs/admin/index.json'
import profissionalIndex from '@/content/docs/profissional/index.json'

function bySlug(globResult) {
  const map = {}
  for (const [path, content] of Object.entries(globResult)) {
    const slug = path.split('/').pop().replace(/\.md$/, '')
    map[slug] = content
  }
  return map
}

const adminDocs = bySlug(import.meta.glob('../../content/docs/admin/*.md', { query: '?raw', import: 'default', eager: true }))
const profissionalDocs = bySlug(import.meta.glob('../../content/docs/profissional/*.md', { query: '?raw', import: 'default', eager: true }))

const DOCS_BY_ROLE = {
  Admin: { index: adminIndex, files: adminDocs },
  Profissional: { index: profissionalIndex, files: profissionalDocs },
}

const HOME_BY_ROLE = { Admin: '/admin', Profissional: '/profissional' }

export default function DocsPage() {
  const { user } = useAuthStore()
  const role = user?.role === 'Admin' ? 'Admin' : 'Profissional'
  const { index, files } = DOCS_BY_ROLE[role]
  const [activeSlug, setActiveSlug] = useState(index[0]?.slug)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const content = useMemo(() => files[activeSlug] ?? '', [activeSlug, files])

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 bg-surface border-b border-line">
        <div className="max-w-[1100px] mx-auto flex items-center gap-3 px-4 md:px-8 py-3.5">
          <button
            onClick={() => setMobileNavOpen((o) => !o)}
            className="p-1.5 -ml-1.5 rounded-lg text-ink-3 hover:bg-surface-3 transition-colors md:hidden"
          >
            <Icon name="menu" size={18} />
          </button>
          <img src={logo} alt="Dauth" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-[14px] leading-none truncate">Documentação</div>
            <div className="text-[11px] text-ink-3 mt-0.5">Dauth Agendamentos · {role}</div>
          </div>
          <Link
            to={HOME_BY_ROLE[role]}
            className="flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-brand transition-colors shrink-0"
          >
            <Icon name="arrowLeft" size={14} />
            Voltar ao app
          </Link>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          <nav className={`md:flex flex-col gap-1 ${mobileNavOpen ? 'flex' : 'hidden'}`}>
            {index.map((item) => (
              <button
                key={item.slug}
                onClick={() => { setActiveSlug(item.slug); setMobileNavOpen(false) }}
                className={`text-left px-3 py-2 rounded-lg text-[13px] transition-colors
                  ${activeSlug === item.slug ? 'bg-brand-soft text-brand font-medium border border-brand/20' : 'text-ink-2 hover:bg-surface-3'}`}
              >
                {item.title}
              </button>
            ))}
          </nav>

          <article className="docs-content bg-surface border border-line rounded-xl p-5 md:p-7 min-w-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  )
}
