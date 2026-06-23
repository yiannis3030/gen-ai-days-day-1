import { useCallback, useEffect, useState } from 'react';
import { ApiError, booksApi } from '../api';
import type { Book, BookRequest } from '../types';
import { Alert, EmptyState, Spinner } from './Feedback';
import { Modal } from './Modal';
import { BookForm } from './BookForm';

export function BooksView(): JSX.Element {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const [genreFilter, setGenreFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Book | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await booksApi.list({
        genre: genreFilter.trim() || undefined,
        author: authorFilter.trim() || undefined,
      });
      setBooks(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load books');
    } finally {
      setLoading(false);
    }
  }, [genreFilter, authorFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = (): void => {
    setEditing(undefined);
    setFormError(undefined);
    setFormOpen(true);
  };

  const openEdit = (book: Book): void => {
    setEditing(book);
    setFormError(undefined);
    setFormOpen(true);
  };

  const handleSubmit = async (payload: BookRequest): Promise<void> => {
    setSubmitting(true);
    setFormError(undefined);
    try {
      setError(undefined);
      if (editing) {
        await booksApi.update(editing.id, payload);
      } else {
        await booksApi.create(payload);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save book');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (book: Book): Promise<void> => {
    if (!window.confirm(`Delete "${book.title}"?`)) {
      return;
    }
    try {
      setError(undefined);
      await booksApi.remove(book.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete book');
    }
  };

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-xs font-medium uppercase text-slate-500">
              Genre
            </label>
            <input
              className="mt-1 block rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              placeholder="e.g. Fantasy"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase text-slate-500">
              Author
            </label>
            <input
              className="mt-1 block rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              placeholder="e.g. Tolkien"
            />
          </div>
          {(genreFilter || authorFilter) && (
            <button
              type="button"
              onClick={() => {
                setGenreFilter('');
                setAuthorFilter('');
              }}
              className="self-end rounded-md px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Add Book
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : books.length === 0 ? (
        <EmptyState message="No books found." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">ISBN</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Genre</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {book.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {book.authors.join(', ')}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{book.isbn}</td>
                  <td className="px-4 py-3 text-slate-600">{book.publishedYear}</td>
                  <td className="px-4 py-3 text-slate-600">{book.genre ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(book)}
                      className="mr-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(book)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <Modal
          title={editing ? 'Edit Book' : 'Add Book'}
          onClose={() => setFormOpen(false)}
        >
          <BookForm
            initial={editing}
            submitting={submitting}
            error={formError}
            onSubmit={(payload) => void handleSubmit(payload)}
            onCancel={() => setFormOpen(false)}
          />
        </Modal>
      )}
    </section>
  );
}

