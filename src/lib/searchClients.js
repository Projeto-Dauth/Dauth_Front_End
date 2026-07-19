import api from '@/lib/api'

export async function searchClients(query) {
  const { data } = await api.get('/users', {
    params: { Role: 'Usuario', limit: 20, ...(query ? { search: query } : {}) }
  })
  return (data.data ?? []).map(c => ({ value: c.UUID, label: c.Name }))
}
