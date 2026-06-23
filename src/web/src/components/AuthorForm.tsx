import { useState } from 'react';
import type { AuthorRequest } from '../types';
import { Alert } from './Feedback';

interface AuthorFormProps {
  readonly submitting: boolean;
  readonly error?: string;
  readonly onSubmit: (payload: AuthorRequest) => void;
  readonly onCancel: () => void;
}

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

export function AuthorForm({
  submitting,
  error,
  onSubmit,
  onCancel,
}: AuthorFormProps): JSX.Element {
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [birthYear, setBirthYear] = useState('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      nationality: nationality.trim() || undefined,
      birthYear: birthYear.trim() ? Number(birthYear) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert message={error} />}

      <div>
        <label className="text-sm font-medium text-slate-700">Name *</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={255}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Nationality
          </label>
          <input
            className={inputClass}
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            maxLength={100}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Birth Year
          </label>
          <input
            type="number"
            className={inputClass}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
          />
        </div>
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
          {submitting ? 'Saving…' : 'Create Author'}
        </button>
      </div>
    </form>
  );
}

