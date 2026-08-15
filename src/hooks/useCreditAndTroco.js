import { useState, useEffect } from 'react'
import api from '@/lib/api'

// Estado + cálculo do "usar crédito do cliente" / "valor recebido" (troco), compartilhado
// entre ModalFecharConta e os painéis de pagamento individual (TabComandas em
// AdminCaixa/ProfissionalComandas) — cada tela decide onde posicionar os campos
// (CreditToggleRow/AmountTenderedField), mas a lógica/estado vem toda daqui.
//
// `resetKey` — muda quando o "alvo" do pagamento muda (ex: trocar de comanda selecionada)
// e precisa limpar useCredit/creditAmount/amountTendered; default = clientId.
export function useCreditAndTroco({ clientId, total, method, resetKey = clientId }) {
  const [creditBalance, setCreditBalance] = useState(0)
  const [useCredit, setUseCredit] = useState(false)
  const [creditAmount, setCreditAmount] = useState('')
  const [amountTendered, setAmountTendered] = useState('')

  useEffect(() => {
    setUseCredit(false)
    setCreditAmount('')
    setAmountTendered('')
    setCreditBalance(0)
    if (clientId) {
      api.get(`/users/${clientId}/credit-balance`)
        .then(({ data }) => setCreditBalance(data.balance ?? 0))
        .catch(() => setCreditBalance(0))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const maxCreditUsable = Math.min(creditBalance, total)
  const parsedCreditAmount = useCredit ? Math.min(parseFloat(String(creditAmount).replace(',', '.')) || 0, maxCreditUsable) : 0
  const remainingAfterCredit = Number((total - parsedCreditAmount).toFixed(2))
  const parsedAmountTendered = parseFloat(String(amountTendered).replace(',', '.'))
  const trocoPreview = method === 'dinheiro' && Number.isFinite(parsedAmountTendered) && parsedAmountTendered > remainingAfterCredit
    ? Number((parsedAmountTendered - remainingAfterCredit).toFixed(2))
    : 0
  // Em dinheiro, o valor recebido é obrigatório — é o que permite calcular o troco de
  // verdade, em vez de assumir pagamento exato.
  const amountTenderedMissing = method === 'dinheiro' && remainingAfterCredit > 0
    && !(Number.isFinite(parsedAmountTendered) && parsedAmountTendered >= remainingAfterCredit)

  const extra = {}
  if (method === 'dinheiro' && Number.isFinite(parsedAmountTendered) && parsedAmountTendered > 0) {
    extra.amountTendered = parsedAmountTendered
  }
  if (parsedCreditAmount > 0) extra.creditAmount = parsedCreditAmount

  return {
    creditBalance, useCredit, setUseCredit, creditAmount, setCreditAmount, maxCreditUsable,
    amountTendered, setAmountTendered, parsedCreditAmount, remainingAfterCredit, trocoPreview,
    amountTenderedMissing, valid: !amountTenderedMissing, extra,
  }
}
