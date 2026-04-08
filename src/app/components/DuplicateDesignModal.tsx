"use client";

import { SharedDesign } from "@/lib/sharedState";
import BuildingImage from "./BuildingImage";

interface DuplicateDesignModalProps {
  design: SharedDesign;
  username: string;
  /** Called when the user clicks "Vote on it". */
  onVote: () => void;
  /** Called when the user dismisses the modal without voting. */
  onClose: () => void;
}

/**
 * Shown when a user clicks "Save to Gallery" but the exact color
 * combination they're trying to save already exists. Lets them
 * thumbs-up the existing design directly instead.
 */
export default function DuplicateDesignModal({
  design,
  username,
  onVote,
  onClose,
}: DuplicateDesignModalProps) {
  const alreadyVoted = design.thumbsUp.includes(username);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="duplicate-modal-title"
          className="text-lg font-semibold text-gray-900"
        >
          This design is already in the Gallery
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Saved by <span className="font-medium">{design.createdBy}</span> on{" "}
          {new Date(design.createdAt).toLocaleDateString()} · currently{" "}
          {design.thumbsUp.length} vote
          {design.thumbsUp.length === 1 ? "" : "s"}.
        </p>

        <div className="mt-4 rounded-lg bg-gradient-to-b from-sky-100 to-sky-50 p-2 shadow-inner">
          <BuildingImage
            colors={design.colors}
            renderWidth={480}
            className="w-full h-auto block rounded"
          />
        </div>

        <div className="mt-5 flex gap-2">
          {alreadyVoted ? (
            <>
              <p className="flex-1 self-center text-sm text-gray-600">
                You&rsquo;ve already voted on this one.
              </p>
              <button
                onClick={onClose}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                OK
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onVote}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <span aria-hidden>👍</span> Vote on it
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
