'use client';

import { FormEvent } from 'react';

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
}

export function SearchForm({ query, setQuery, onSubmit, loading }: SearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Přezdívka, Faceit URL nebo Steam URL..."
        className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-orange-500 focus:outline-none text-white placeholder-gray-500"
      />
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
      >
        {loading ? 'Hledám...' : 'Hledat'}
      </button>
    </form>
  );
}

