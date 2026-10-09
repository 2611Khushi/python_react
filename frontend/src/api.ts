export type BookStatus = 'To read' | 'Reading' | 'Finished'

export interface Book {
  id: number
  title: string
  author: string
  genre: string
  status: BookStatus
  pages: number
  current_page: number
  rating: number | null
  notes: string
}

export type BookInput = Omit<Book, 'id'>

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = typeof body?.detail === 'string' ? body.detail : 'Something went wrong. Please try again.'
    throw new Error(detail)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function getBooks(query = '', status = '') {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (status) params.set('status', status)
  const suffix = params.size ? `?${params.toString()}` : ''
  return request<Book[]>(`/books${suffix}`)
}

export function createBook(book: BookInput) {
  return request<Book>('/books', { method: 'POST', body: JSON.stringify(book) })
}

export function updateBook(id: number, book: BookInput) {
  return request<Book>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(book) })
}

export function deleteBook(id: number) {
  return request<void>(`/books/${id}`, { method: 'DELETE' })
}
