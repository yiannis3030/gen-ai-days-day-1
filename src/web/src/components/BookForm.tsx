import { useState } from 'react';
import type { Book, BookRequest } from '../types';
import { Alert } from './Feedback';

interface BookFormProps {
  readonly initial?: Book;
  readonly submitting: boolean;
  readonly error?: string;
  readonly onSubmit: (payload: BookRequest) => void;
  readonly onCancel: () => void;
}

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

export function BookForm({
  initial,
  submitting,
  error,
  onSubmit,
  onCancel,
}: BookFormProps): JSX.Element {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [authors, setAuthors] = useState<string[]>(
    initial?.authors.length ? initial.authors : [''],
  );
  const [isbn, setIsbn] = useState(initial?.isbn ?? '');
  const [publishedYear, setPublishedYear] = useState(
    initial?.publishedYear?.toString() ?? '',
  );
  const [genre, setGenre] = useState(initial?.genre ?? '');
  const [authorsError, setAuthorsError] = useState<string | undefined>();

  const updateAuthor = (index: number, value: string): void => {
    setAuthors((prev) => prev.map((a, i) => (i === index ? value : a)));
  };

  const addAuthor = (): void => setAuthors((prev) => [...prev, '']);

  const removeAuthor = (index: number): void =>
    setAuthors((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmed = authors.map((a) => a.trim()).filter(Boolean);
    if (trimmed.length === 0) {
      setAuthorsError('At least one non-empty author is required.');
      return;
    }
    setAuthorsError(undefined);
    onSubmit({
      title: title.trim(),
      authors: trimmed,
      isbn: isbn.trim(),
      publishedYear: Number(publishedYear),
      genre: genre.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert message={error} />}

      <div>
        <label className="text-sm font-medium text-slate-700">Title *</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={255}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Authors * <span className="text-xs text-slate-400">(at least one)</span>
        </label>
        <div className="space-y-2 mt-1">
          {authors.map((author, index) => (
            <div key={index} className="flex gap-2">
              <input
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={author}
                onChange={(e) => updateAuthor(index, e.target.value)}
                maxLength={255}
                placeholder={`Author ${index + 1}`}
              />
              {authors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAuthor(index)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm text-red-500 hover:bg-red-50"
                  aria-label="Remove author"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addAuthor}
            className="text-sm text-slate-500 hover:text-slate-800 underline"
          >
            + Add another author
          </button>
        </div>
        {authorsError && (
          <p className="mt-1 text-sm text-red-600">{authorsError}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">ISBN *</label>
          <input
            className={inputClass}
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Published Year *
          </label>
          <input
            type="number"
            className={inputClass}
            value={publishedYear}
            onChange={(e) => setPublishedYear(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Genre</label>
        <input
          className={inputClass}
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : initial ? 'Update Book' : 'Create Book'}
        </button>
      </div>
    </form>
  );
}
