"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface UsernameModalProps {
  /** Called when the user submits a non-empty name. */
  onSubmit: (name: string) => void;
}

/**
 * Blocking first-visit modal that collects the user's name. The parent only
 * renders this when there is no stored username, so the UI is unreachable
 * until a name has been entered. Persistence is the parent's responsibility.
 */
export default function UsernameModal({ onSubmit }: UsernameModalProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }, [value, onSubmit]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="username-modal-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2
          id="username-modal-title"
          className="text-lg font-semibold text-gray-900"
        >
          Welcome to the CBAP Lodge Designer
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          What should we call you? Your name will be shown on any designs you
          save to the gallery.
        </p>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Your name"
          className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
