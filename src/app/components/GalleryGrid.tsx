"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MCBI_COLORS, ColorSelection } from "@/lib/colors";
import { SharedDesign } from "@/lib/sharedState";
import {
  fetchSharedState,
  updateSharedState,
  isJsonBinConfigured,
  getCachedSharedState,
} from "@/lib/jsonbin";
import { getUsername, setUsername as persistUsername } from "@/lib/storage";
import BuildingImage from "./BuildingImage";
import UsernameModal from "./UsernameModal";

function colorName(hex: string): string {
  return MCBI_COLORS.find((c) => c.hex === hex)?.name || hex;
}

function describeDesign(colors: ColorSelection): string {
  return `Roof: ${colorName(colors.roof)} · Walls: ${colorName(
    colors.walls,
  )} · Trim: ${colorName(colors.trim)}`;
}

export default function GalleryGrid() {
  const router = useRouter();

  const configured = isJsonBinConfigured();

  const [username, setUsernameState] = useState<string | null>(null);
  // Initialize from the module cache if the layout's preloader has
  // already populated it — this avoids a "Loading gallery…" flash when
  // navigating to /gallery after the page has been open for a moment.
  const [designs, setDesigns] = useState<SharedDesign[]>(
    () => getCachedSharedState()?.designs ?? [],
  );
  // Frozen sort order — set once when designs first arrive and then
  // never re-sorted on local interactions like voting. Cards stay put
  // so the user doesn't lose their place after clicking thumbs-up.
  const [sortedIds, setSortedIds] = useState<string[] | null>(null);
  // Loading is only true when configured AND the cache is empty. The
  // early-return path is the same as before.
  const [loading, setLoading] = useState(
    () => configured && getCachedSharedState() === null,
  );
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [postingComments, setPostingComments] = useState<Set<string>>(
    new Set(),
  );
  // Pending background server writes for vote toggles, keyed by design id.
  // We chain new clicks onto the previous promise so writes serialize per
  // design but the UI stays optimistic.
  const voteWriteChains = useRef<Map<string, Promise<void>>>(new Map());

  // Load username on mount. One-time read of client-only state — the lint
  // rule's cascading-render concern doesn't apply to a single setState on
  // mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsernameState(getUsername());
  }, []);

  // Fetch gallery designs on mount.
  useEffect(() => {
    if (!configured) return;
    fetchSharedState()
      .then((state) => setDesigns(state.designs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [configured]);

  // Freeze the sort order the first time we have designs to show. After
  // this fires once, voting / commenting / etc. won't reshuffle the grid.
  useEffect(() => {
    if (sortedIds !== null || designs.length === 0) return;
    const sorted = [...designs].sort(
      (a, b) =>
        b.thumbsUp.length - a.thumbsUp.length || b.createdAt - a.createdAt,
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSortedIds(sorted.map((d) => d.id));
  }, [designs, sortedIds]);

  const handleSetUsername = useCallback((name: string) => {
    setUsernameState(name);
    persistUsername(name);
  }, []);

  const handleLoadIntoDesigner = useCallback(
    (colors: ColorSelection) => {
      const params = new URLSearchParams({
        roof: colors.roof,
        walls: colors.walls,
        trim: colors.trim,
      });
      router.push(`/?${params.toString()}`);
    },
    [router],
  );

  const handleToggleVote = useCallback(
    (designId: string) => {
      if (!username || !configured) return;

      // Optimistic local update so the button visual + count change
      // immediately, without waiting for the JSONBin roundtrip.
      setDesigns((prev) =>
        prev.map((d) => {
          if (d.id !== designId) return d;
          const has = d.thumbsUp.includes(username);
          return {
            ...d,
            thumbsUp: has
              ? d.thumbsUp.filter((u) => u !== username)
              : [...d.thumbsUp, username],
          };
        }),
      );

      // Background server write. Chain per-design so rapid clicks
      // serialize their writes against the most-recent cached state
      // (avoids one slow PUT clobbering a newer fast PUT).
      const prevChain =
        voteWriteChains.current.get(designId) ?? Promise.resolve();
      const nextChain = prevChain
        .catch(() => {})
        .then(async () => {
          const state = await fetchSharedState();
          const design = state.designs.find((d) => d.id === designId);
          if (!design) return;
          const idx = design.thumbsUp.indexOf(username);
          if (idx >= 0) {
            design.thumbsUp.splice(idx, 1);
          } else {
            design.thumbsUp.push(username);
          }
          await updateSharedState(state);
        });
      voteWriteChains.current.set(designId, nextChain);
    },
    [username, configured],
  );

  const handleAddComment = useCallback(
    async (designId: string) => {
      if (!username || !configured) return;
      const text = (commentDrafts[designId] || "").trim();
      if (!text) return;
      // Guard against double-submit: if a post for this design is already
      // in flight, ignore the second click / Enter press. Checked against
      // the state setter so we see the current value synchronously.
      let alreadyPosting = false;
      setPostingComments((prev) => {
        if (prev.has(designId)) {
          alreadyPosting = true;
          return prev;
        }
        const next = new Set(prev);
        next.add(designId);
        return next;
      });
      if (alreadyPosting) return;
      try {
        const state = await fetchSharedState();
        const design = state.designs.find((d) => d.id === designId);
        if (!design) return;
        design.comments.push({
          id: crypto.randomUUID(),
          author: username,
          text,
          createdAt: Date.now(),
        });
        await updateSharedState(state);
        setDesigns([...state.designs]);
        setCommentDrafts((prev) => ({ ...prev, [designId]: "" }));
      } catch {
      } finally {
        setPostingComments((prev) => {
          if (!prev.has(designId)) return prev;
          const next = new Set(prev);
          next.delete(designId);
          return next;
        });
      }
    },
    [username, configured, commentDrafts],
  );

  const handleDeleteComment = useCallback(
    async (designId: string, commentId: string) => {
      if (!username || !configured) return;
      try {
        const state = await fetchSharedState();
        const design = state.designs.find((d) => d.id === designId);
        if (!design) return;
        const comment = design.comments.find((c) => c.id === commentId);
        if (!comment || comment.author !== username) return;
        design.comments = design.comments.filter((c) => c.id !== commentId);
        await updateSharedState(state);
        setDesigns([...state.designs]);
      } catch {}
    },
    [username, configured],
  );

  const handleDelete = useCallback(
    async (designId: string) => {
      if (!username || !configured) return;
      try {
        const state = await fetchSharedState();
        const design = state.designs.find((d) => d.id === designId);
        // Only the original creator can delete their own design.
        if (!design || design.createdBy !== username) return;
        if (
          !window.confirm(
            "Delete this design? This can't be undone.",
          )
        ) {
          return;
        }
        state.designs = state.designs.filter((d) => d.id !== designId);
        await updateSharedState(state);
        setDesigns([...state.designs]);
      } catch {}
    },
    [username, configured],
  );

  const toggleCommentExpand = useCallback((designId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(designId)) {
        next.delete(designId);
      } else {
        next.add(designId);
      }
      return next;
    });
  }, []);

  // Render in the order frozen at first load. Designs that appeared
  // after the freeze (e.g. someone else just saved one) get appended
  // at the end so they don't disrupt the existing layout.
  const sortedDesigns = useMemo(() => {
    if (sortedIds === null) {
      // Pre-freeze fallback (only used briefly on first paint).
      return [...designs].sort(
        (a, b) =>
          b.thumbsUp.length - a.thumbsUp.length || b.createdAt - a.createdAt,
      );
    }
    const byId = new Map(designs.map((d) => [d.id, d]));
    const out: SharedDesign[] = [];
    const seen = new Set<string>();
    for (const id of sortedIds) {
      const d = byId.get(id);
      if (d) {
        out.push(d);
        seen.add(id);
      }
    }
    for (const d of designs) {
      if (!seen.has(d.id)) out.push(d);
    }
    return out;
  }, [designs, sortedIds]);

  const showUsernameModal = username === "";

  if (!configured) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-sm text-gray-500 italic">
          Gallery is not configured (JSONBin credentials missing).
        </div>
      </div>
    );
  }

  return (
    <>
      {showUsernameModal && <UsernameModal onSubmit={handleSetUsername} />}

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-16">
            Loading gallery…
          </div>
        ) : sortedDesigns.length === 0 ? (
          <div className="text-center text-gray-400 italic py-16">
            No designs yet. Head over to the Designer to save the first one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {sortedDesigns.map((design) => {
              const voted = !!username && design.thumbsUp.includes(username);
              const expanded = expandedComments.has(design.id);

              return (
                <div
                  key={design.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Rendered lodge image — click to load into Designer */}
                  <div className="relative">
                    <button
                      onClick={() => handleLoadIntoDesigner(design.colors)}
                      className="block w-full bg-gradient-to-b from-sky-100 to-sky-50 cursor-pointer"
                      title="Load this design into the Designer"
                    >
                      <BuildingImage
                        colors={design.colors}
                        renderWidth={720}
                        className="w-full h-auto block"
                      />
                    </button>

                    {/* Thumbs-up overlay */}
                    <button
                      onClick={() => handleToggleVote(design.id)}
                      disabled={!username}
                      className={`absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium shadow transition-colors active:scale-95 active:shadow-sm ${
                        voted
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-white/95 text-gray-700 hover:bg-white"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={
                        !username
                          ? "Set your name first"
                          : design.thumbsUp.length === 0
                            ? "No votes yet — click to vote"
                            : `Voted by:\n${design.thumbsUp.join("\n")}\n\n${
                                voted
                                  ? "Click to remove your vote"
                                  : "Click to vote"
                              }`
                      }
                    >
                      <span aria-hidden>👍</span>
                      <span>{design.thumbsUp.length}</span>
                    </button>
                  </div>

                  {/* Caption */}
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="text-sm font-medium text-gray-800 leading-snug">
                      {describeDesign(design.colors)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                      <span>
                        by {design.createdBy} ·{" "}
                        {new Date(design.createdAt).toLocaleDateString()}
                      </span>
                      {username && design.createdBy === username && (
                        <button
                          onClick={() => handleDelete(design.id)}
                          className="text-red-500 hover:text-red-700 hover:underline ml-auto"
                          title="Delete this design"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Comments toggle */}
                    <button
                      onClick={() => toggleCommentExpand(design.id)}
                      className="mt-2 text-xs text-gray-500 hover:text-gray-700 text-left"
                    >
                      {design.comments.length === 0
                        ? "Add a comment…"
                        : `${design.comments.length} comment${
                            design.comments.length === 1 ? "" : "s"
                          } ${expanded ? "▲" : "▼"}`}
                    </button>

                    {expanded && (
                      <div className="mt-2 border-t border-gray-100 pt-2 space-y-2">
                        {design.comments.map((c) => (
                          <div key={c.id} className="text-sm">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-700">
                                {c.author}
                              </span>
                              <span className="text-gray-400 text-xs">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                              {username && c.author === username && (
                                <button
                                  onClick={() =>
                                    handleDeleteComment(design.id, c.id)
                                  }
                                  className="ml-auto text-xs text-red-500 hover:text-red-700 hover:underline"
                                  title="Delete this comment"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                            <p className="text-gray-600 mt-0.5">{c.text}</p>
                          </div>
                        ))}

                        {username ? (
                          (() => {
                            const posting = postingComments.has(design.id);
                            const draft = commentDrafts[design.id] || "";
                            return (
                              <div className="flex gap-2 mt-2">
                                <input
                                  type="text"
                                  value={draft}
                                  onChange={(e) =>
                                    setCommentDrafts((prev) => ({
                                      ...prev,
                                      [design.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !posting) {
                                      handleAddComment(design.id);
                                    }
                                  }}
                                  disabled={posting}
                                  placeholder="Write a comment…"
                                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-50 disabled:text-gray-400"
                                />
                                <button
                                  onClick={() => handleAddComment(design.id)}
                                  disabled={posting || !draft.trim()}
                                  className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                >
                                  {posting && (
                                    <svg
                                      className="animate-spin h-3.5 w-3.5"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      aria-hidden
                                    >
                                      <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeOpacity="0.25"
                                        strokeWidth="4"
                                      />
                                      <path
                                        d="M4 12a8 8 0 018-8"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  )}
                                  <span>{posting ? "Posting…" : "Post"}</span>
                                </button>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-xs text-gray-400 italic">
                            Set your name to comment.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
