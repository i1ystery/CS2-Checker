interface HeatmapPlaceholderProps {
  mapName: string;
}

export function HeatmapPlaceholder({ mapName }: HeatmapPlaceholderProps) {
  return (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 p-8">
      <h2 className="text-xl font-bold mb-4">Heatmapa</h2>
      <div className="bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-700 p-16 text-center">
        <div className="max-w-md mx-auto">
          <svg
            className="w-24 h-24 mx-auto mb-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-gray-400 text-lg mb-2">Heatmapa bude dostupná brzy</p>
          <p className="text-gray-500 text-sm">
            Vizualizace pozic hráčů na mapě {mapName} bude přidána v budoucí verzi
          </p>
        </div>
      </div>
    </div>
  );
}

