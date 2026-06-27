import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '@/logo-dauth-agendamentos.png'

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const FEATURES = [
  { label: 'agendamento', title: 'Horário marcado em segundos', desc: 'Escolha o serviço, a profissional e o horário disponível. Tudo pelo navegador — sem precisar instalar nada.' },
  { label: 'histórico', title: 'Seus agendamentos num só lugar', desc: 'Veja tudo que já passou e o que está por vir. Cancele ou acompanhe o status sem precisar falar com ninguém.' },
  { label: 'pacotes', title: 'Compre uma vez, use durante meses', desc: 'Pacotes de sessões com desconto. O app conta quantas sessões você já usou — você só agenda.' },
]

const FAQS = [
  { q: 'Preciso instalar algum aplicativo?', a: 'Não. O Dauth é 100% web — você acessa direto pelo navegador do celular, do tablet ou do computador. Sem baixar nada, sem ocupar espaço.' },
  { q: 'O Dauth é gratuito para mim?', a: 'Sim, totalmente. Você acessa, agenda e acompanha seus horários sem nenhuma taxa.' },
  { q: 'Como funciona o pagamento?', a: 'O pagamento é feito diretamente no salão após o atendimento. O app registra a comanda e o salão escolhe o método (Pix, dinheiro, débito ou crédito).' },
  { q: 'E se eu precisar cancelar?', a: 'Você pode cancelar pelo app a qualquer momento. O salão define a política de prazo — o app sempre mostra as condições antes de você confirmar.' },
  { q: 'Posso escolher a profissional?', a: 'Sim. Na hora de agendar você vê quais profissionais estão disponíveis para o serviço escolhido e seleciona a que preferir.' },
  { q: 'O que são pacotes de sessões?', a: 'São combos de serviços que você compra com desconto. Por exemplo, 5 hidratações por um preço fixo. O app controla quantas sessões você já usou — é só agendar quando quiser usar.' },
]

const NAV_LINKS = [
  { href: '#como', label: 'Como funciona' },
  { href: '#servicos', label: 'O que oferece' },
  { href: '#faq', label: 'Perguntas' },
]

export default function PortalPage() {
  const [menuOpen, setMenuOpen] = useState(false)

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
            <Link to="/login" className="hidden sm:inline-flex h-[40px] items-center px-4 rounded-md text-[14px] hover:bg-brand-soft transition-colors">
              Entrar
            </Link>
            <Link to="/agendar" className="hidden sm:inline-flex h-[40px] items-center gap-2 px-5 rounded-md text-[14px] font-medium bg-ink text-bg hover:bg-ink-2 transition-colors">
              Agendar agora <ArrowRight />
            </Link>
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
              <Link to="/agendar" onClick={() => setMenuOpen(false)}
                className="flex justify-center items-center h-[46px] rounded-md bg-ink text-bg text-[14px] font-medium hover:bg-ink-2 transition-colors">
                Agendar agora
              </Link>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="flex justify-center items-center h-[46px] rounded-md border border-line text-[14px] text-ink-2 hover:bg-surface-2 transition-colors">
                Entrar na conta
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 pt-14 md:pt-20 pb-16 md:pb-24 grid grid-cols-12 gap-6 md:gap-10">

          <div className="col-span-12 lg:col-span-7">
            <div className="flex items-center gap-3 mb-8 md:mb-10 flex-wrap">
              <span className="bg-bg border border-line rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-2 shadow-xs">
                agendamento online · 100% web
              </span>
            </div>

            <h1 className="font-display font-medium leading-[0.92] tracking-tight mb-3 text-ink" style={{ fontSize: 'clamp(48px, 8vw, 92px)' }}>
              Sua beleza,<br />
              <span className="font-serif italic font-normal text-brand" style={{ fontSize: 'clamp(54px, 9vw, 100px)' }}>
                marcada
              </span>{' '}
              com calma.
            </h1>

            <p className="text-[16px] md:text-[19px] leading-[1.55] text-ink-2 max-w-[520px] mt-6 md:mt-8 mb-8 md:mb-10">
              Agende seus horários pelo navegador — sem precisar instalar nada, sem esperar resposta no WhatsApp. Funciona no celular, no tablet e no computador.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-10 md:mb-12">
              <Link to="/agendar" className="inline-flex h-[50px] md:h-[54px] items-center gap-3 px-6 md:px-7 rounded-md text-[14px] md:text-[15px] font-medium bg-ink text-bg hover:bg-ink-2 transition-colors">
                Agendar agora <ArrowRight />
              </Link>
              <Link to="/register" className="inline-flex h-[50px] md:h-[54px] items-center px-5 md:px-6 rounded-md text-[14px] md:text-[15px] border border-line hover:bg-brand-soft transition-colors">
                Criar conta grátis
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-[480px] md:max-w-[560px] border-t border-line pt-6 md:pt-7">
              {[
                { val: '100%', label: 'web · sem instalar' },
                { val: 'grátis', label: 'para clientes' },
                { val: 'celular', sub: ' · tablet · pc', label: 'funciona em qualquer tela' },
              ].map(({ val, sub, label }) => (
                <div key={label}>
                  <div className="font-display font-medium text-[20px] md:text-[24px] text-ink leading-none">
                    {val}{sub && <span className="text-ink-4 text-[13px]">{sub}</span>}
                  </div>
                  <div className="font-mono text-[10px] md:text-[10.5px] uppercase tracking-widest text-ink-3 mt-2">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: phone mockup — desktop only */}
          <div className="col-span-12 lg:col-span-5 relative min-h-[600px] hidden lg:block">
            <div className="absolute top-0 right-0 w-[78%] aspect-[4/5] rounded-md overflow-hidden border border-line">
              <img src="/hero-tela-horarios.webp" alt="Tela de horários" className="w-full h-full object-cover object-top" />
            </div>

            <div className="absolute bottom-0 left-0 w-[52%]">
              <img src="/hero-agenda-mobile.webp" alt="App de agendamento" className="w-full h-auto drop-shadow-xl" />
            </div>

            <div className="absolute top-8 left-2 bg-bg border border-line rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-2 shadow-sm -rotate-6">
              100% web · sem instalar
            </div>
            <div className="absolute bottom-12 right-4 bg-bg border border-line rounded-md p-4 shadow-sm w-[200px]">
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4 mb-1">funciona em</div>
              <div className="font-display font-medium text-[20px] text-ink leading-none">celular · tablet<br />desktop</div>
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-1/3 w-[1px] h-32 bg-gold hidden lg:block" />
      </section>

      {/* ── PROBLEMA / VIRADA ── */}
      <section className="border-b border-line">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-20 md:py-28">
          <div className="grid grid-cols-12 gap-6 md:gap-10 mb-14 md:mb-20">
            <div className="col-span-12">
              <h2 className="font-display font-medium leading-[1.02] text-ink" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
                Beleza não devia depender de mensagem não respondida<span className="text-brand">.</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="border border-line rounded-md p-6 md:p-8 h-full" style={{ background: 'rgba(245,239,233,0.4)' }}>
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4 mb-6">antes</div>
              <ul className="flex flex-col gap-4 md:gap-5 text-[15px] md:text-[16px] leading-[1.55] text-ink-2">
                {[
                  'Você manda mensagem perguntando se tem horário',
                  'Espera meia hora pela resposta',
                  'O horário que serve já não está disponível',
                  'Vocês trocam mais cinco mensagens',
                  'Você esquece, perde o horário',
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-serif italic text-gold text-[20px] leading-none mt-1 shrink-0">{['i.', 'ii.', 'iii.', 'iv.', 'v.'][i]}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-ink rounded-md p-6 md:p-8 bg-ink text-bg h-full">
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-gold mb-6">com Dauth</div>
              <ul className="flex flex-col gap-4 md:gap-5 text-[15px] md:text-[16px] leading-[1.55]" style={{ color: 'rgba(253,244,245,0.85)' }}>
                {[
                  'Abre o app e vê todos os horários disponíveis, em tempo real',
                  'Escolhe a profissional que prefere',
                  'Confirma com um toque',
                  'Remarca pelo app se precisar — sem precisar ligar',
                  'Acompanha seu histórico e seus pacotes de sessões',
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-serif italic text-gold text-[20px] leading-none mt-1 shrink-0">{['i.', 'ii.', 'iii.', 'iv.', 'v.'][i]}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como" className="border-b border-line" style={{ background: 'rgba(245,236,226,0.4)' }}>
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-20 md:py-28">
          <div className="grid grid-cols-12 gap-6 md:gap-10 mb-12 md:mb-16">
            <div className="col-span-12">
              <h2 className="font-display font-medium leading-[1.02] text-ink mb-4 md:mb-6" style={{ fontSize: 'clamp(28px, 5vw, 56px)' }}>
                Simples <span className="font-serif italic font-normal text-brand">assim.</span>
              </h2>
              <p className="text-[16px] md:text-[18px] text-ink-2 max-w-[520px] leading-[1.55]">
                Pensado para quem tem rotina apertada e não quer perder uma tarde tentando marcar um horário.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                num: '01', img: '/passo-01-servico.webp', alt: 'Tela de escolha de serviço',
                title: 'Escolha o serviço',
                desc: 'Veja os serviços disponíveis no salão e selecione o que você quer.',
              },
              {
                num: '02', img: '/passo-02-profissional.webp', alt: 'Tela de escolha de profissional',
                title: 'Escolha a profissional',
                desc: 'Selecione a profissional de sua preferência e veja os horários disponíveis.',
              },
              {
                num: '03', img: '/passo-03-horarios.png', alt: 'Tela de escolha de dia e horário',
                title: 'Escolha o dia e horário',
                desc: 'Veja os horários disponíveis em tempo real e escolha o que encaixa na sua rotina.',
              },
              {
                num: '04', img: '/passo-03-confirmacao.webp', alt: 'Tela de confirmação',
                title: 'Confirme em segundos',
                desc: 'Confirme com um toque. Você acompanha, remarca ou cancela pelo app quando precisar.',
              },
            ].map((step, i) => (
              <article key={step.num} className={`relative ${i === 1 ? 'md:mt-8' : ''} ${i === 2 ? 'md:mt-16' : ''} ${i === 3 ? 'md:mt-24' : ''}`}>
                <div className="rounded-md aspect-[4/5] mb-6 relative overflow-hidden border border-line bg-surface">
                  <img src={step.img} alt={step.alt} className="w-full h-full object-cover object-top" />
                  <div className="absolute top-4 right-4 bg-bg/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center border border-line">
                    <span className="font-mono text-[11px] font-medium text-ink">{step.num}</span>
                  </div>
                </div>
                <h3 className="font-display font-medium text-[22px] md:text-[24px] text-ink mb-2">{step.title}</h3>
                <p className="text-[14px] md:text-[15px] text-ink-3 leading-[1.6] max-w-[300px]">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── O QUE O APP OFERECE ── */}
      <section id="servicos" className="border-b border-line bg-ink text-bg">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-20 md:py-28">
          <div className="grid grid-cols-12 gap-6 md:gap-10 mb-12 md:mb-16">
            <div className="col-span-12">
              <h2 className="font-display font-medium leading-[1.02] text-bg max-w-[820px]" style={{ fontSize: 'clamp(28px, 5vw, 56px)' }}>
                Tudo que você precisa<br />para cuidar da sua <span className="font-serif italic font-normal text-gold">beleza</span>.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-bg/15 border border-bg/15 rounded-md overflow-hidden">
            {FEATURES.map((f) => (
              <article key={f.label} className="bg-ink p-6 md:p-8">
                <div className="font-mono text-[10.5px] uppercase tracking-widest text-gold mb-5">{f.label}</div>
                <div className="font-display font-medium text-[20px] md:text-[24px] mb-3">{f.title}</div>
                <p className="text-[13px] md:text-[14px] leading-[1.6]" style={{ color: 'rgba(253,244,245,0.7)' }}>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-b border-line">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-20 md:py-28 grid grid-cols-12 gap-6 md:gap-10">
          <div className="col-span-12 md:col-span-4">
            <h2 className="font-display font-medium leading-[1.05] text-ink" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
              Resposta<br />antes da <span className="font-serif italic font-normal text-brand">dúvida</span>.
            </h2>
            <p className="text-[14px] md:text-[15px] text-ink-3 mt-5 md:mt-6 leading-[1.6] max-w-[320px]">
              Não achou a sua? Fala com o salão — respondemos em minutos no horário comercial.
            </p>
          </div>

          <div className="col-span-12 md:col-span-8 divide-y divide-line border-y border-line">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group py-5 md:py-6 px-1 cursor-pointer">
                <summary className="flex justify-between items-center gap-4 md:gap-6">
                  <span className="font-display font-medium text-[16px] md:text-[19px] text-ink">{faq.q}</span>
                  <span className="font-mono text-[18px] md:text-[20px] leading-none text-ink-4 shrink-0 group-open:rotate-45 transition-transform inline-block">+</span>
                </summary>
                <p className="mt-4 md:mt-5 text-[14px] md:text-[15px] leading-[1.65] text-ink-2 pr-6 md:pr-10">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="acessar" className="border-b border-line">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-24 md:py-32">
          <div className="grid grid-cols-12 gap-6 md:gap-10 items-center">
            <div className="col-span-12 lg:col-span-7">
              <img src={logo} alt="Dauth" className="w-14 md:w-16 h-14 md:h-16 rounded-xl object-cover mb-6 md:mb-8 opacity-90" />
              <h2 className="font-display font-medium leading-[0.95] text-ink mb-6 md:mb-8" style={{ fontSize: 'clamp(48px, 7vw, 88px)' }}>
                Sua próxima<br />
                <span className="font-serif italic font-normal text-brand">visita</span> está<br />
                a um clique.
              </h2>
              <p className="text-[16px] md:text-[18px] leading-[1.55] text-ink-2 max-w-[480px] mb-8 md:mb-10">
                Acesse pelo navegador, veja os horários disponíveis e marque em menos de um minuto. Sem instalar nada.
              </p>

              <div className="flex flex-wrap gap-3 mb-6 md:mb-8">
                <Link to="/register" className="inline-flex h-[52px] md:h-[58px] items-center gap-3 px-6 md:px-8 rounded-md bg-ink text-bg hover:bg-ink-2 transition-colors text-[14px] md:text-[15px] font-medium">
                  Criar conta grátis <ArrowRight />
                </Link>
                <Link to="/agendar" className="inline-flex h-[52px] md:h-[58px] items-center px-6 md:px-7 rounded-md text-[14px] md:text-[15px] border border-line hover:bg-brand-soft transition-colors">
                  Agendar sem cadastro
                </Link>
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
            </div>

            <div className="col-span-12 lg:col-span-5 relative min-h-[560px] hidden lg:block">
              <img src="/cta-imagem-01.webp" alt="Dashboard admin Dauth" className="absolute top-0 right-8 rounded-md w-[260px] aspect-[3/4] border border-line object-cover object-top" />
              <img src="/cta-imagem-02.webp" alt="Meus combos Dauth" className="absolute top-32 left-0 rounded-md w-[220px] aspect-[4/5] border border-line object-cover object-top" />
              <div className="absolute bottom-0 right-0 bg-bg border border-line rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-ink-2 shadow-sm">
                dauth agendamentos
              </div>
            </div>
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
              Plataforma de agendamento online para salões de beleza — marque seus horários pelo navegador, sem precisar instalar nada.
            </p>
          </div>

          <div className="col-span-6 md:col-span-2">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4 mb-4">portal</div>
            <ul className="flex flex-col gap-2 text-[13px] md:text-[14px] text-ink-2">
              <li><a href="#como" className="hover:text-brand transition-colors">Como funciona</a></li>
              <li><a href="#servicos" className="hover:text-brand transition-colors">O que oferece</a></li>
              <li><Link to="/agendar" className="hover:text-brand transition-colors">Agendar agora</Link></li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4 mb-4">conta</div>
            <ul className="flex flex-col gap-2 text-[13px] md:text-[14px] text-ink-2">
              <li><Link to="/login" className="hover:text-brand transition-colors">Entrar</Link></li>
              <li><Link to="/register" className="hover:text-brand transition-colors">Criar conta</Link></li>
              <li><Link to="/agendar" className="hover:text-brand transition-colors">Agendar sem cadastro</Link></li>
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
