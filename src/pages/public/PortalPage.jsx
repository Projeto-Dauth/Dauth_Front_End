import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '@/logo-dauth-agendamentos.png'
import HandWrittenTitle from '@/components/ui/HandWrittenTitle'
import BlurFade from '@/components/ui/BlurFade'

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const WHATSAPP_LINK = 'https://wa.me/55SEUNUMERO'

const FEATURES = [
  { label: 'agenda', title: 'Grade por profissional, sem overbooking', desc: 'Cada funcionária com sua coluna, folgas marcadas, conflito de horário bloqueado automaticamente. Você enxerga o salão inteiro numa tela só.' },
  { label: 'caixa & comissão', title: 'Comanda, repasse e fiado sob controle', desc: 'Fechamento de comanda por cliente, comissão calculada sozinha por profissional e mensalistas com fiado organizado — sem planilha, sem caderno.' },
  { label: 'painel', title: 'Faturamento e ranking em tempo real', desc: 'Quanto entrou no mês, ticket médio, quem mais vendeu. Números prontos pra você decidir sem precisar somar nada.' },
]

const FAQS = [
  { q: 'Preciso instalar algum sistema no salão?', a: 'Não. O Dauth é 100% web — você e sua equipe acessam pelo navegador, do celular ou do computador do salão. Sem instalação, sem servidor próprio.' },
  { q: 'Minhas clientes precisam baixar algo?', a: 'Não. Elas agendam por um link que você compartilha — abre direto no navegador, sem app pra instalar.' },
  { q: 'Como funciona a comissão das profissionais?', a: 'Você cadastra o percentual de cada uma por serviço. O sistema calcula e mostra o valor a repassar automaticamente, com histórico de pagamentos.' },
  { q: 'Dá pra controlar cliente fiado ou mensalista?', a: 'Sim. Você fecha a comanda como fiado e o sistema mantém o valor pendente até você registrar a quitação — com relatório de quem está devendo.' },
  { q: 'Quanto tempo leva pra colocar o salão no ar?', a: 'Depois da conversa inicial, cadastramos seus serviços, profissionais e horários com você — geralmente pronto em poucos dias.' },
  { q: 'Funciona pra salão pequeno, com 8-10 funcionárias?', a: 'É exatamente esse o tamanho que o Dauth foi pensado para atender: grande o bastante pra bagunçar no WhatsApp, pequeno o bastante pra você querer o controle na mão.' },
]

const NAV_LINKS = [
  { href: '#como', label: 'Como funciona' },
  { href: '#servicos', label: 'O que você ganha' },
  { href: '#faq', label: 'Perguntas' },
]

export default function PortalPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Dauth | Sistema de gestão para salões de beleza'
    return () => { document.title = previousTitle }
  }, [])

  return (
    <div className="font-body text-ink antialiased">

      {/* ── HEADER ── */}
      <header className="border-b border-line sticky top-0 z-30 backdrop-blur-sm" style={{ background: 'rgba(253,244,245,0.95)' }}>
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 h-[64px] md:h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Dauth" className="w-9 h-9 rounded-lg object-cover" />
            <div className="leading-tight">
              <div className="font-display font-medium text-[18px] tracking-tight">Dauth</div>
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4 -mt-0.5">agendamentos</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[14px] text-ink-2">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="hover:text-brand transition-colors">{l.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* <Link to="/login" className="hidden sm:inline-flex h-[40px] items-center px-4 rounded-md text-[14px] hover:bg-brand-soft transition-colors">
              Entrar
            </Link> */}
            {/* <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="hidden sm:inline-flex h-[40px] items-center gap-2 px-5 rounded-md text-[14px] font-medium bg-ink text-bg hover:bg-ink-2 transition-colors">
              Falar no WhatsApp <ArrowRight />
            </a> */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg border border-line hover:bg-surface-2 transition-colors gap-[5px]"
              aria-label="Abrir menu"
            >
              <span className="w-5 h-[1.5px] bg-ink rounded-full" />
              <span className="w-5 h-[1.5px] bg-ink rounded-full" />
              <span className="w-5 h-[1.5px] bg-ink rounded-full" />
            </button>
          </div>
        </div>
      </header>

      {/* ── DRAWER MOBILE ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-[280px] bg-bg border-l border-line flex flex-col shadow-md">
            <div className="flex items-center justify-between px-5 h-[64px] border-b border-line">
              <div className="flex items-center gap-2.5">
                <img src={logo} alt="Dauth" className="w-7 h-7 rounded-lg object-cover" />
                <span className="font-display font-medium text-[15px] tracking-tight">Dauth</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 rounded-lg border border-line flex items-center justify-center hover:bg-surface-2 transition-colors text-ink-3"
                aria-label="Fechar menu"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col px-3 py-4 gap-1 flex-1">
              {NAV_LINKS.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  className="px-3 py-3 rounded-lg text-[15px] text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors">
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="px-4 pb-8 flex flex-col gap-2.5 border-t border-line pt-4">
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}
                className="flex justify-center items-center h-[46px] rounded-md bg-ink text-bg text-[14px] font-medium hover:bg-ink-2 transition-colors">
                Falar no WhatsApp
              </a>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="flex justify-center items-center h-[46px] rounded-md border border-line text-[14px] text-ink-2 hover:bg-surface-2 transition-colors">
                Entrar na conta
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-line flex items-center min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-72px)]">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 w-full">
          <HandWrittenTitle
            title={
              <h1 className="font-display font-medium leading-[0.92] tracking-tight text-ink" style={{ fontSize: 'clamp(40px, 12.5vw, 168px)' }}>
                Seu salão,<br />
                <motion.span
                  className="inline-block font-serif italic font-normal text-brand"
                  style={{ fontSize: 'clamp(44px, 14vw, 184px)' }}
                  initial={{ opacity: 0, scale: 0.8, rotate: -4 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 1, duration: 0.7, ease: [0.43, 0.13, 0.23, 0.96] }}
                >
                  organizado
                </motion.span>{' '}
                de verdade.
              </h1>
            }
            subtitle={
              <div className="flex flex-col items-center">
                <p className="font-semibold text-[16px] md:text-[19px] leading-[1.55] text-ink-2 max-w-[520px] text-center">
                  Agenda, comissão e caixa num só lugar — sem planilha, sem caderno, sem depender do WhatsApp pra saber quem tem horário e quanto cada profissional tem a receber.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 mt-8 md:mt-10">
                  <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="inline-flex h-[50px] md:h-[54px] items-center gap-3 px-6 md:px-7 rounded-md text-[14px] md:text-[15px] font-medium bg-ink text-bg hover:bg-ink-2 transition-colors">
                    Falar no WhatsApp <ArrowRight />
                  </a>
                  {/* <Link to="/login" className="inline-flex h-[50px] md:h-[54px] items-center px-5 md:px-6 rounded-md text-[14px] md:text-[15px] border border-line hover:bg-brand-soft transition-colors">
                    Já tenho conta
                  </Link> */}
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* ── PROBLEMA / VIRADA ── */}
      <section className="border-b border-line">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-20 md:py-28">
          <BlurFade className="grid grid-cols-12 gap-6 md:gap-10 mb-14 md:mb-20">
            <div className="col-span-12">
              <h2 className="font-display font-medium leading-[1.02] text-ink" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
                Gerir salão não devia ser um segundo emprego<span className="text-brand">.</span>
              </h2>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <BlurFade delay={0.05} className="border border-line rounded-md p-6 md:p-8 h-full" style={{ background: 'rgba(245,239,233,0.4)' }}>
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4 mb-6">antes</div>
              <ul className="flex flex-col gap-4 md:gap-5 text-[15px] md:text-[16px] leading-[1.55] text-ink-2">
                {[
                  'Agenda no caderno, com risco de marcar duas clientes no mesmo horário',
                  'Comissão calculada na mão, uma por uma, no fim do mês',
                  'Cliente fiado que você perde o controle de quem já pagou',
                  'WhatsApp lotado de "tem horário amanhã?"',
                  'Você só descobre o faturamento do mês somando notinha',
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-serif italic text-gold text-[20px] leading-none mt-1 shrink-0">{['i.', 'ii.', 'iii.', 'iv.', 'v.'][i]}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </BlurFade>

            <BlurFade delay={0.15} className="border border-ink rounded-md p-6 md:p-8 bg-ink text-bg h-full">
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-gold mb-6">com Dauth</div>
              <ul className="flex flex-col gap-4 md:gap-5 text-[15px] md:text-[16px] leading-[1.55]" style={{ color: 'rgba(253,244,245,0.85)' }}>
                {[
                  'Grade visual por profissional — conflito de horário fica impossível',
                  'Comissão calculada sozinha, por profissional e por serviço',
                  'Fiado e mensalista com relatório de quem está devendo',
                  'Clientes agendam por um link — sem trocar mensagem',
                  'Faturamento, ticket médio e ranking em um painel só',
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-serif italic text-gold text-[20px] leading-none mt-1 shrink-0">{['i.', 'ii.', 'iii.', 'iv.', 'v.'][i]}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como" className="border-b border-line" style={{ background: 'rgba(245,236,226,0.4)' }}>
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-20 md:py-28">
          <BlurFade className="grid grid-cols-12 gap-6 md:gap-10 mb-12 md:mb-16">
            <div className="col-span-12">
              <h2 className="font-display font-medium leading-[1.02] text-ink mb-4 md:mb-6" style={{ fontSize: 'clamp(28px, 5vw, 56px)' }}>
                Simples <span className="font-serif italic font-normal text-brand">de colocar no ar.</span>
              </h2>
              <p className="text-[16px] md:text-[18px] text-ink-2 max-w-[520px] leading-[1.55]">
                Sem migração complicada, sem treinamento longo. Cadastramos seu salão com você e sua equipe já começa a usar.
              </p>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                num: '01', img: '/passo-01-servico.webp', alt: 'Tela de cadastro de serviços',
                title: 'Cadastramos seu salão',
                desc: 'Serviços, preços, comissão por profissional e horário de cada uma — feito junto com você.',
              },
              {
                num: '02', img: '/passo-02-profissional.webp', alt: 'Tela de agenda por profissional',
                title: 'Sua equipe entra na agenda',
                desc: 'Cada profissional com login próprio, vendo só a própria agenda e comissão.',
              },
              {
                num: '03', img: '/passo-03-horarios.webp', alt: 'Tela de grade de horários',
                title: 'Clientes agendam pelo link',
                desc: 'Você compartilha um link — a cliente escolhe serviço, profissional e horário sem trocar mensagem.',
              },
              {
                num: '04', img: '/passo-03-confirmacao.webp', alt: 'Tela de painel financeiro',
                title: 'Você acompanha tudo',
                desc: 'Caixa, comissão e faturamento do mês num painel só, direto do celular ou computador.',
              },
            ].map((step, i) => (
              <BlurFade as="article" key={step.num} delay={i * 0.1} className={`relative ${i === 1 ? 'md:mt-8' : ''} ${i === 2 ? 'md:mt-16' : ''} ${i === 3 ? 'md:mt-24' : ''}`}>
                <div className="rounded-md aspect-[4/5] mb-6 relative overflow-hidden border border-line bg-surface">
                  <img src={step.img} alt={step.alt} className="w-full h-full object-cover object-top" />
                  <div className="absolute top-4 right-4 bg-bg/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center border border-line">
                    <span className="font-mono text-[11px] font-medium text-ink">{step.num}</span>
                  </div>
                </div>
                <h3 className="font-display font-medium text-[22px] md:text-[24px] text-ink mb-2">{step.title}</h3>
                <p className="text-[14px] md:text-[15px] text-ink-3 leading-[1.6] max-w-[300px]">{step.desc}</p>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ── O QUE O APP OFERECE ── */}
      <section id="servicos" className="border-b border-line bg-ink text-bg">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-20 md:py-28">
          <BlurFade className="grid grid-cols-12 gap-6 md:gap-10 mb-12 md:mb-16">
            <div className="col-span-12">
              <h2 className="font-display font-medium leading-[1.02] text-bg max-w-[820px]" style={{ fontSize: 'clamp(28px, 5vw, 56px)' }}>
                Tudo que você precisa<br />pra tocar o <span className="font-serif italic font-normal text-gold">salão</span>.
              </h2>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-bg/15 border border-bg/15 rounded-md overflow-hidden">
            {FEATURES.map((f, i) => (
              <BlurFade as="article" key={f.label} delay={i * 0.1} className="bg-ink p-6 md:p-8">
                <div className="font-mono text-[10.5px] uppercase tracking-widest text-gold mb-5">{f.label}</div>
                <div className="font-display font-medium text-[20px] md:text-[24px] mb-3">{f.title}</div>
                <p className="text-[13px] md:text-[14px] leading-[1.6]" style={{ color: 'rgba(253,244,245,0.7)' }}>{f.desc}</p>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-b border-line">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-20 md:py-28 grid grid-cols-12 gap-6 md:gap-10">
          <BlurFade className="col-span-12 md:col-span-4">
            <h2 className="font-display font-medium leading-[1.05] text-ink" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
              Resposta<br />antes da <span className="font-serif italic font-normal text-brand">dúvida</span>.
            </h2>
            <p className="text-[14px] md:text-[15px] text-ink-3 mt-5 md:mt-6 leading-[1.6] max-w-[320px]">
              Não achou a sua? Chama a gente no WhatsApp — respondemos rápido.
            </p>
          </BlurFade>

          <div className="col-span-12 md:col-span-8 divide-y divide-line border-y border-line">
            {FAQS.map((faq, i) => (
              <BlurFade as="details" key={faq.q} delay={i * 0.06} className="group py-5 md:py-6 px-1 cursor-pointer">
                <summary className="flex justify-between items-center gap-4 md:gap-6">
                  <span className="font-display font-medium text-[16px] md:text-[19px] text-ink">{faq.q}</span>
                  <span className="font-mono text-[18px] md:text-[20px] leading-none text-ink-4 shrink-0 group-open:rotate-45 transition-transform inline-block">+</span>
                </summary>
                <p className="mt-4 md:mt-5 text-[14px] md:text-[15px] leading-[1.65] text-ink-2 pr-6 md:pr-10">{faq.a}</p>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="acessar" className="border-b border-line">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-24 md:py-32">
          <div className="grid grid-cols-12 gap-6 md:gap-10 items-center">
            <BlurFade className="col-span-12 lg:col-span-7">
              <img src={logo} alt="Dauth" className="w-14 md:w-16 h-14 md:h-16 rounded-xl object-cover mb-6 md:mb-8 opacity-90" />
              <h2 className="font-display font-medium leading-[0.95] text-ink mb-6 md:mb-8" style={{ fontSize: 'clamp(48px, 7vw, 88px)' }}>
                Seu salão<br />
                <span className="font-serif italic font-normal text-brand">no controle</span> está<br />
                a uma conversa.
              </h2>
              <p className="text-[16px] md:text-[18px] leading-[1.55] text-ink-2 max-w-[480px] mb-8 md:mb-10">
                Chama a gente no WhatsApp e a gente te mostra como fica a agenda, o caixa e a comissão da sua equipe dentro do Dauth.
              </p>

              <div className="flex flex-wrap gap-3 mb-6 md:mb-8">
                <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="inline-flex h-[52px] md:h-[58px] items-center gap-3 px-6 md:px-8 rounded-md bg-ink text-bg hover:bg-ink-2 transition-colors text-[14px] md:text-[15px] font-medium">
                  Falar no WhatsApp <ArrowRight />
                </a>
                {/* <Link to="/login" className="inline-flex h-[52px] md:h-[58px] items-center px-6 md:px-7 rounded-md text-[14px] md:text-[15px] border border-line hover:bg-brand-soft transition-colors">
                  Já tenho conta
                </Link> */}
              </div>

              <div className="flex items-center gap-3 md:gap-4 text-[12px] md:text-[13px] text-ink-3 flex-wrap">
                <span className="font-mono text-[10.5px] uppercase tracking-widest">funciona em</span>
                {['celular', 'tablet', 'desktop'].map((d) => (
                  <span key={d} className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="4" y="1" width="6" height="12" rx="1" /></svg>
                    {d}
                  </span>
                ))}
              </div>
            </BlurFade>

            <BlurFade delay={0.15} className="col-span-12 lg:col-span-5 relative min-h-[560px] hidden lg:block">
              <img src="/cta-imagem-01.webp" alt="Dashboard admin Dauth" className="absolute top-0 right-8 rounded-md w-[260px] aspect-[3/4] border border-line object-cover object-top" />
              <img src="/cta-imagem-02.webp" alt="Meus combos Dauth" className="absolute top-32 left-0 rounded-md w-[220px] aspect-[4/5] border border-line object-cover object-top" />
              {/* <div className="absolute bottom-0 right-0 bg-bg border border-line rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-ink-2 shadow-sm">
                dauth agendamentos
              </div> */}
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-bg">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-12 md:py-16 grid grid-cols-12 gap-6 md:gap-8">
          <div className="col-span-12 md:col-span-5">
            <div className="flex items-center gap-3 mb-4 md:mb-5">
              <img src={logo} alt="Dauth" className="w-9 md:w-10 h-9 md:h-10 rounded-lg object-cover" />
              <div className="leading-tight">
                <div className="font-display font-medium text-[20px] md:text-[22px] text-ink">Dauth</div>
                <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4 -mt-0.5">agendamentos</div>
              </div>
            </div>
            <p className="text-[13px] md:text-[14px] text-ink-3 leading-[1.6] max-w-[360px]">
              Sistema de gestão para salões de beleza — agenda, caixa e comissão da sua equipe num só lugar.
            </p>
          </div>

          <div className="col-span-6 md:col-span-2">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4 mb-4">portal</div>
            <ul className="flex flex-col gap-2 text-[13px] md:text-[14px] text-ink-2">
              <li><a href="#como" className="hover:text-brand transition-colors">Como funciona</a></li>
              <li><a href="#servicos" className="hover:text-brand transition-colors">O que você ganha</a></li>
              <li><a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="hover:text-brand transition-colors">Falar no WhatsApp</a></li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4 mb-4">conta</div>
            <ul className="flex flex-col gap-2 text-[13px] md:text-[14px] text-ink-2">
              <li><Link to="/login" className="hover:text-brand transition-colors">Entrar</Link></li>
              <li><a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="hover:text-brand transition-colors">Solicitar acesso</a></li>
            </ul>
          </div>

          <div className="col-span-12 md:col-span-3">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4 mb-4">contato</div>
            <ul className="flex flex-col gap-2 text-[13px] md:text-[14px] text-ink-2">
              <li><Link to="/privacidade" className="hover:text-brand transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/termos" className="hover:text-brand transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-line">
          <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-5 md:py-6 flex items-center justify-between flex-wrap gap-4">
            <div className="font-mono text-[10px] md:text-[10.5px] uppercase tracking-widest text-ink-4">
              © 2026 Dauth Agendamentos
            </div>
            <div className="font-mono text-[10px] md:text-[10.5px] uppercase tracking-widest text-ink-4">v1.0</div>
          </div>
        </div>
      </footer>

    </div>
  )
}
