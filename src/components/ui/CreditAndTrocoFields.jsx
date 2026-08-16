import { useEffect } from 'react'
import { useCreditAndTroco } from '@/hooks/useCreditAndTroco'
import CreditToggleRow from '@/components/ui/CreditToggleRow'
import AmountTenderedField from '@/components/ui/AmountTenderedField'

function formatCurrency(v) {
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Composição de CreditToggleRow + AmountTenderedField usada por ModalFecharConta (bloco
// único, nessa ordem: crédito → "a cobrar" → valor recebido) — reporta pro pai via
// `onChange({ extra, remainingAfterCredit, valid })` a cada mudança. Os painéis de
// pagamento individual (TabComandas) usam `useCreditAndTroco` + os 2 componentes
// diretamente, em vez deste wrapper, porque posicionam os campos em lugares diferentes da
// tela (crédito entre Valor e Status, valor recebido perto do método de pagamento).
export default function CreditAndTrocoFields({ clientId, total, method, onChange }) {
  const cr = useCreditAndTroco({ clientId, total, method })

  useEffect(() => {
    onChange?.({ extra: cr.extra, remainingAfterCredit: cr.remainingAfterCredit, valid: cr.valid })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cr.remainingAfterCredit, cr.valid, JSON.stringify(cr.extra)])

  return (
    <>
      <CreditToggleRow cr={cr} />

      {cr.parsedCreditAmount > 0 && (
        <div className="flex items-center justify-between py-2 text-[14px]">
          <span className="text-ink-3">A cobrar de {method === 'fiado' ? 'mensalista' : 'outra forma'}</span>
          <span className="font-mono font-medium text-ink">{formatCurrency(cr.remainingAfterCredit)}</span>
        </div>
      )}

      <AmountTenderedField cr={cr} method={method} topBorder={cr.creditBalance <= 0} />
    </>
  )
}
