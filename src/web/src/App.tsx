import { useState } from 'react';
import { BooksView } from './components/BooksView';
import { AuthorsView } from './components/AuthorsView';

type Tab = 'books' | 'authors';

export default function App(): JSX.Element {
  const [tab, setTab] = useState<Tab>('books');

  const tabClass = (active: boolean): string =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-slate-800 text-slate-900'
        : 'border-transparent text-slate-500 hover:text-slate-700'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <h1 className="text-2xl font-bold tracking-tight">📚 Book Library</h1>
          <p className="text-sm text-slate-500">
            Manage your books and authors
          </p>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-2 px-6">
          <button
            type="button"
            className={tabClass(tab === 'books')}
            onClick={() => setTab('books')}
          >
            Books
          </button>
          <button
            type="button"
            className={tabClass(tab === 'authors')}
            onClick={() => setTab('authors')}
          >
            Authors
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {tab === 'books' ? <BooksView /> : <AuthorsView />}
      </main>
    </div>
  );
}

