import { Suspense } from "react";
import Visualizer from "./components/Visualizer";

export default function Home() {
  return (
    <div className="py-6">
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
  );
}
