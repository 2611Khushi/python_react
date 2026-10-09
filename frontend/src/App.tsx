import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowDownUp,
  BookMarked,
  BookOpen,
  Check,
  ChevronDown,
  CirclePlus,
  Library,
  ListFilter,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { createBook, deleteBook, getBooks, updateBook, type Book, type BookInput, type BookStatus } from './api'

const statuses: Array<'All books' | BookStatus> = ['All books', 'Reading', 'To read', 'Finished']
const genres = ['Fiction', 'Nonfiction', 'Art', 'Nature', 'History', 'Poetry', 'Creativity', 'Other']
const blankBook: BookInput = {
  title: '',
  author: '',
  genre: 'Fiction',
  status: 'To read',
  pages: 0,
  current_page: 0,
  rating: null,
  notes: '',
}

function coverTone(genre: string) {
  const palette = ['cover-olive', 'cover-coral', 'cover-blue', 'cover-plum', 'cover-sun', 'cover-pine']
  const hash = [...genre].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return palette[hash % palette.length]
}

function BookEditor({
  book,
  onClose,
  onSave,
}: {
  book: Book | null
  onClose: () => void
  onSave: (input: BookInput, id?: number) => Promise<void>
}) {
  const [form, setForm] = useState<BookInput>(book ? { ...book } : { ...blankBook })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  function updateField<Key extends keyof BookInput>(key: Key, value: BookInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await onSave(form, book?.id)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save this book.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="editor-title" aria-modal="true" className="editor" role="dialog">
        <div className="editor-head">
          <div>
            <span className="eyebrow">YOUR READING JOURNAL</span>
            <h2 id="editor-title">{book ? 'Edit book' : 'Add a book'}</h2>
          </div>
          <button aria-label="Close dialog" className="icon-button quiet" onClick={onClose} type="button"><X size={19} /></button>
        </div>
        <form onSubmit={submit}>
          <label className="field wide">
            <span>Title</span>
            <input autoFocus maxLength={160} onChange={(event) => updateField('title', event.target.value)} placeholder="A book to remember" required value={form.title} />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Author</span>
              <input maxLength={120} onChange={(event) => updateField('author', event.target.value)} placeholder="Author name" required value={form.author} />
            </label>
            <label className="field">
              <span>Genre</span>
              <span className="select-wrap"><select onChange={(event) => updateField('genre', event.target.value)} value={form.genre}>{genres.map((genre) => <option key={genre}>{genre}</option>)}</select><ChevronDown size={16} /></span>
            </label>
          </div>
          <div className="field-row three-fields">
            <label className="field">
              <span>Status</span>
              <span className="select-wrap"><select onChange={(event) => updateField('status', event.target.value as BookStatus)} value={form.status}>{statuses.filter((status) => status !== 'All books').map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={16} /></span>
            </label>
            <label className="field">
              <span>Total pages</span>
              <input min="0" onChange={(event) => updateField('pages', Number(event.target.value))} type="number" value={form.pages} />
            </label>
            <label className="field">
              <span>Page now</span>
              <input max={form.pages || undefined} min="0" onChange={(event) => updateField('current_page', Number(event.target.value))} type="number" value={form.current_page} />
            </label>
          </div>
          <label className="field">
            <span>Rating <small>optional</small></span>
            <span className="select-wrap"><select onChange={(event) => updateField('rating', event.target.value ? Number(event.target.value) : null)} value={form.rating ?? ''}><option value="">Not rated</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} {rating === 1 ? 'star' : 'stars'}</option>)}</select><ChevronDown size={16} /></span>
          </label>
          <label className="field">
            <span>Notes <small>optional</small></span>
            <textarea maxLength={2000} onChange={(event) => updateField('notes', event.target.value)} placeholder="A line, a thought, a passage to return to..." rows={3} value={form.notes} />
          </label>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="editor-actions">
            <button className="button secondary" onClick={onClose} type="button">Cancel</button>
            <button className="button primary" disabled={saving} type="submit">{saving ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}{book ? 'Save changes' : 'Add to shelf'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function App() {
  const [books, setBooks] = useState<Book[]>([])
  const [query, setQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'All books' | BookStatus>('All books')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editorBook, setEditorBook] = useState<Book | null | undefined>(undefined)
  const [sortNewest, setSortNewest] = useState(true)

  async function loadBooks() {
    setLoading(true)
    setError('')
    try {
      const result = await getBooks(query, selectedStatus === 'All books' ? '' : selectedStatus)
      setBooks(result)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not connect to the API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBooks(), query ? 220 : 0)
    return () => window.clearTimeout(timer)
  }, [query, selectedStatus])

  const readingCount = books.filter((book) => book.status === 'Reading').length
  const finishedCount = books.filter((book) => book.status === 'Finished').length
  const pagesRead = books.reduce((total, book) => total + book.current_page, 0)
  const visibleBooks = sortNewest ? books : [...books].reverse()

  async function saveBook(input: BookInput, id?: number) {
    if (id === undefined) await createBook(input)
    else await updateBook(id, input)
    setEditorBook(undefined)
    await loadBooks()
  }

  async function removeBook(book: Book) {
    if (!window.confirm(`Remove “${book.title}” from your shelf?`)) return
    try {
      await deleteBook(book.id)
      await loadBooks()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not remove this book.')
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a aria-label="Fieldnotes home" className="brand" href="#top">
          <span className="brand-mark"><BookOpen size={19} strokeWidth={1.8} /></span>
          <span>fieldnotes<span className="brand-period">.</span></span>
        </a>
        <div className="side-label">YOUR SPACE</div>
        <nav aria-label="Library filters" className="side-nav">
          {statuses.map((status) => {
            const Icon = status === 'All books' ? Library : status === 'Reading' ? BookOpen : status === 'To read' ? BookMarked : Check
            return <button aria-current={selectedStatus === status ? 'page' : undefined} className={`nav-item ${selectedStatus === status ? 'active' : ''}`} key={status} onClick={() => setSelectedStatus(status)}><Icon size={17} strokeWidth={1.8} /><span>{status}</span><span className="nav-count">{status === 'All books' ? books.length : books.filter((book) => book.status === status).length}</span></button>
          })}
        </nav>
        <div className="sidebar-note">
          <span className="note-ornament"><Sparkles size={16} /></span>
          <p>“A reader lives a thousand lives before he dies.”</p>
          <span className="note-credit">GEORGE R. R. MARTIN</span>
        </div>
        <div className="sidebar-bottom"><span className="online-dot" />YOUR PRIVATE LIBRARY</div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar">
          <div className="breadcrumb">My library <span>/</span> <strong>{selectedStatus}</strong></div>
          <div className="topbar-actions">
            <span className="date-note">A little space for good books</span>
            <button className="button primary add-button" onClick={() => setEditorBook(null)}><CirclePlus size={17} />Add a book</button>
          </div>
        </header>

        <section className="welcome-section">
          <div className="welcome-copy">
            <div className="eyebrow"><span className="eyebrow-line" />YOUR BOOKS, YOUR PACE</div>
            <h1>A life between<br /><em>the pages.</em></h1>
            <p className="intro">Keep the stories you’re reading close, and the ones you’ve loved closer.</p>
          </div>
          <div aria-hidden="true" className="hero-stilllife">
            <div className="stilllife-sun" />
            <div className="stilllife-book book-back"><span>THE ART<br />OF NOTICING</span><small>ESSAYS</small></div>
            <div className="stilllife-book book-front"><span>NOTES<br />ON A<br />QUIET LIFE</span><small>FIELD EDITION</small></div>
            <div className="stilllife-stem stem-one" /><div className="stilllife-stem stem-two" />
          </div>
        </section>

        <section aria-label="Reading statistics" className="stats-row">
          <div className="stat"><span className="stat-label">ON YOUR SHELF</span><strong>{books.length.toString().padStart(2, '0')}</strong><span className="stat-foot">books collected</span></div>
          <div className="stat"><span className="stat-label">IN PROGRESS</span><strong>{readingCount.toString().padStart(2, '0')}</strong><span className="stat-foot">currently reading</span></div>
          <div className="stat"><span className="stat-label">PAGES TURNED</span><strong>{pagesRead.toLocaleString()}</strong><span className="stat-foot">across every story</span></div>
          <div className="stat stat-last"><span className="stat-label">RECENTLY FINISHED</span><strong>{finishedCount.toString().padStart(2, '0')}</strong><span className="stat-foot">stories stayed with you</span></div>
        </section>

        <section className="library-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" />THE COLLECTION</div>
              <h2>Your bookshelf<span className="heading-period">.</span></h2>
            </div>
            <div className="section-tools">
              <label className="search-box"><Search size={17} /><input aria-label="Search books" onChange={(event) => setQuery(event.target.value)} placeholder="Title or author" value={query} /><kbd>/</kbd></label>
              <button aria-label="Reverse book order" className="icon-button sort-button" onClick={() => setSortNewest((current) => !current)} title="Reverse book order"><ArrowDownUp size={17} /></button>
              <button aria-label="Filter by status" className="icon-button filter-button" onClick={() => setSelectedStatus((current) => current === 'All books' ? 'Reading' : 'All books')} title="Toggle reading filter"><ListFilter size={17} /></button>
            </div>
          </div>
          <div aria-label="Filter books by status" className="status-tabs" role="tablist">
            {statuses.map((status) => <button aria-selected={selectedStatus === status} className={`status-tab ${selectedStatus === status ? 'selected' : ''}`} key={status} onClick={() => setSelectedStatus(status)} role="tab">{status}<span>{status === 'All books' ? books.length : books.filter((book) => book.status === status).length}</span></button>)}
          </div>

          {error && <div className="error-banner" role="alert"><span>{error}</span><button className="text-button" onClick={() => void loadBooks()}>Try again</button></div>}
          {loading ? (
            <div className="loading-state"><LoaderCircle className="spin" size={24} /><span>Gathering your books...</span></div>
          ) : visibleBooks.length ? (
            <div className="book-grid">
              {visibleBooks.map((book) => {
                const progress = book.pages > 0 ? Math.min(100, Math.round((book.current_page / book.pages) * 100)) : 0
                return (
                  <article className="book-card" key={book.id}>
                    <div className={`book-cover ${coverTone(book.genre)}`}>
                      <div className="cover-topline"><span>FN / {String(book.id).padStart(2, '0')}</span><MoreHorizontal size={17} /></div>
                      <div className="cover-title">{book.title}</div>
                      <div className="cover-rule" />
                      <div className="cover-author">{book.author}</div>
                      <div className="cover-bottom"><span>{book.genre.toUpperCase()}</span><span>{book.pages ? `${book.pages} PP` : 'FIELD NOTES'}</span></div>
                      <div aria-label={book.status} className={`cover-status ${book.status === 'Finished' ? 'is-finished' : book.status === 'Reading' ? 'is-reading' : ''}`}>{book.status === 'Finished' ? <Check size={13} /> : book.status === 'Reading' ? <BookOpen size={13} /> : <BookMarked size={13} />}</div>
                    </div>
                    <div className="book-meta">
                      <div className="book-title-row"><div><h3>{book.title}</h3><p>{book.author}</p></div><div className="book-actions"><button aria-label={`Edit ${book.title}`} className="icon-button tiny" onClick={() => setEditorBook(book)} title="Edit book"><Pencil size={15} /></button><button aria-label={`Delete ${book.title}`} className="icon-button tiny danger-hover" onClick={() => void removeBook(book)} title="Delete book"><Trash2 size={15} /></button></div></div>
                      <div className="book-progress-row"><span>{book.status === 'Finished' ? 'Finished reading' : book.status === 'Reading' ? `${book.current_page} of ${book.pages || '—'} pages` : 'Waiting on your shelf'}</span>{book.rating && <span className="rating"><Star size={13} fill="currentColor" />{book.rating}</span>}</div>
                      {book.status === 'Reading' && <div aria-label={`${progress}% read`} className="progress-track"><span style={{ width: `${progress}%` }} /></div>}
                      {book.notes && <p className="book-note">“{book.notes}”</p>}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-mark"><BookOpen size={23} /></div><h3>{query ? 'No pages found.' : 'A shelf with room to grow.'}</h3><p>{query ? 'Try another title or author.' : 'Add the book you’re reading, or one you can’t wait to start.'}</p>{!query && <button className="button secondary" onClick={() => setEditorBook(null)}><CirclePlus size={16} />Add your first book</button>}</div>
          )}
          <footer className="library-footer"><span><span className="online-dot" />{books.length} BOOK{books.length === 1 ? '' : 'S'} IN THIS COLLECTION</span><span>MADE FOR THE MARGINS <span className="footer-flower">✳</span></span></footer>
        </section>
      </main>
      {editorBook !== undefined && <BookEditor book={editorBook} onClose={() => setEditorBook(undefined)} onSave={saveBook} />}
    </div>
  )
}

export default App
