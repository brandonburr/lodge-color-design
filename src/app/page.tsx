import { Suspense } from "react";
import Visualizer from "./components/Visualizer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            CBAP Lodge Designer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose colors for your lodge — roof, walls, and trim
          </p>
        </div>
      </header>

      {/* Main content */}
      <div className="py-6 flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-96">
              <div className="text-gray-400">Loading visualizer...</div>
            </div>
          }
        >
          <Visualizer />
        </Suspense>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-400">
          CBAP Lodge Designer — Select and share building color combinations
        </div>
      </footer>
    </main>
  );
}
