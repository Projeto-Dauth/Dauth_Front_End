// Data pura (YYYY-MM-DD) não passa por Date: new Date('2026-09-23') é meia-noite UTC e recua um dia no fuso do Brasil.
export function formatDate(iso) {
  if (!iso) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }
  return new Date(iso).toLocaleDateString('pt-BR')
}
