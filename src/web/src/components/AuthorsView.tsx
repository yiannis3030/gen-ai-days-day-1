import { useCallback, useEffect, useState } from 'react';
import { ApiError, authorsApi } from '../api';
import type { Author, AuthorRequest, Book } from '../types';
import { Alert, EmptyState, Spinner } from './Feedback';
import { Modal } from './Modal';
import { AuthorForm } from './AuthorForm';

export function AuthorsView(): JSX.Element {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();

  const [selected, setSelected] = useState<Author>();
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(undefined);
    try {
      setAuthors(await authorsApi.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load authors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (payload: AuthorRequest): Promise<void> => {
    setSubmitting(true);
    setFormError(undefined);
    try {
      setError(undefined);
      await authorsApi.create(payload);
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to create author',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const viewBooks = async (author: Author): Promise<void> => {
    setSelected(author);
    setBooksLoading(true);
    try {
      setError(undefined);
      setAuthorBooks(await authorsApi.books(author.id));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load author books',
      );
    } finally {
      setBooksLoading(false);
    }
  };

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">{authors.length} author(s)</p>
        <button
          type="button"
          onClick={() => {
            setFormError(undefined);
            setFormOpen(true);
          }}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Add Author
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : authors.length === 0 ? (
        <EmptyState message="No authors yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <div
              key={author.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h3 className="text-base font-semibold text-slate-800">
                {author.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {author.nationality ?? 'Unknown nationality'}
                {author.birthYear ? ` · b. ${author.birthYear}` : ''}
              </p>
              <button
                type="button"
                onClick={() => void viewBooks(author)}
                className="mt-3 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                View books →
              </button>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <Modal title="Add Author" onClose={() => setFormOpen(false)}>
          <AuthorForm
            submitting={submitting}
            error={formError}
            onSubmit={(payload) => void handleSubmit(payload)}
            onCancel={() => setFormOpen(false)}
          />
        </Modal>
      )}

      {selected && (
        <Modal
          title={`Books by ${selected.name}`}
          onClose={() => setSelected(undefined)}
        >
          {booksLoading ? (
            <Spinner />
          ) : authorBooks.length === 0 ? (
            <EmptyState message="This author has no books." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {authorBooks.map((book) => (
                <li key={book.id} className="py-2">
                  <p className="font-medium text-slate-800">{book.title}</p>
                  <p className="text-sm text-slate-500">
                    {book.publishedYear}
                    {book.genre ? ` · ${book.genre}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </section>
  );
}

