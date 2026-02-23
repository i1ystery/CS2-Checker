'use client';

interface DemoUploadGuideProps {
  matchId: string;
}

export function DemoUploadGuide({ matchId }: DemoUploadGuideProps) {
  const matchroomUrl = `https://www.faceit.com/en/cs2/room/${matchId}`;

  return (
    <div className="bg-gray-900/50 rounded-lg border border-gray-700/30 p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white mb-2">Jak získat demo soubor?</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-orange-500 font-semibold">1.</span>
              <div className="flex-1">
                <span className="text-gray-300">Otevřete </span>
                <a
                  href={matchroomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:text-orange-400 transition-colors inline-flex items-center gap-1"
                >
                  matchroom
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500 font-semibold">2.</span>
              <span className="text-gray-300">Stáhněte demo soubor (.zst) z matchroomu</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500 font-semibold">3.</span>
              <span className="text-gray-300">Dekomprimujte soubor (.zst → .dem) pomocí 7-Zip, WinRAR nebo podobného nástroje</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500 font-semibold">4.</span>
              <span className="text-gray-300">Nahrajte dekomprimovaný .dem soubor pomocí tlačítka níže</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

