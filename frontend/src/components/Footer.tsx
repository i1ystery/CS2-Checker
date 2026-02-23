import Link from 'next/link';

/**
 * Footer komponenta pro zobrazení informací o bakalářském projektu
 */
export function Footer() {
  return (
    <footer className="bg-gray-800/50 border-t border-gray-700/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="text-center text-sm text-gray-400">
          <p>Bakalářský projekt • Autor: Maksym Kuzma</p>
        </div>
      </div>
    </footer>
  );
}




