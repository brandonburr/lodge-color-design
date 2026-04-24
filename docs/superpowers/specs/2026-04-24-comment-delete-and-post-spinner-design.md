# Comment Delete + Post Spinner

## Problem

Two UX gaps in the gallery's comment feature in [GalleryGrid.tsx](src/app/components/GalleryGrid.tsx):

1. **No way to delete your own comment.** A user posted the same comment three times (race condition from feature 2) and has no way to clean it up.
2. **No in-flight feedback on Post.** Clicking Post (or pressing Enter) fires an async round-trip with no visual response, so users click again — resulting in duplicate posts.

## Feature 1 — Delete your own comment

### Behavior

- Each comment rendered in the expanded comment list gets a small "Delete" link, shown **only** to the comment's author (i.e. when `username === comment.author`).
- Click removes the comment immediately — no confirmation dialog. (This is a deliberate deviation from the existing design-delete flow, where `window.confirm` is used; comments are lower-stakes.)
- Uses the established fetch→mutate→update pattern: `fetchSharedState`, mutate the `comments` array in memory, `updateSharedState`, then `setDesigns([...state.designs])`.

### UX

- Placement: inline with the comment row, right-aligned. Small text, red on hover, consistent with the existing design-delete link at `GalleryGrid.tsx:319-327`.
- Label: "Delete" (matches design-delete).

### Data

- No schema change. `DesignComment` already has `author` and `id`.
- Deletion is by `comment.id` filter: `design.comments = design.comments.filter(c => c.id !== commentId)`.

## Feature 2 — Post in-flight state

### Behavior

- Track a per-design pending flag: `postingComments: Set<string>` (set of design IDs currently submitting).
- When `handleAddComment(designId)` starts: add `designId` to the set.
- When it finishes (success or error): remove it.

### UX while pending

- Post button shows a small inline spinner in place of (or alongside) its current label, and is `disabled`.
- Input is `disabled` so the user can't edit the draft mid-submit.
- Enter keydown is ignored (guard at the top of `handleAddComment` against re-entry on the same designId, and skip submit on Enter if pending).

### Why this fixes the triple-post

The actual duplicate-post race: `handleAddComment` is async and takes a full network round-trip. Between click-1 and the state update that clears the draft, nothing stops click-2 and click-3. The pending flag is checked *synchronously* at the top of the handler and early-returns, making repeat clicks (and Enter mashing) no-ops.

### Spinner

Small inline SVG spinner — Tailwind `animate-spin`, ~14px, in the button. No new dep.

## Non-goals

- Editing comments (out of scope).
- Admin-level deletion of others' comments (out of scope).
- Optimistic UI for post or delete (keep the simple fetch→mutate→update; the pending state covers the UX gap).
- Toasts or error surfacing (existing code also swallows errors in `catch {}`; staying consistent).

## Files touched

- `src/app/components/GalleryGrid.tsx` — all changes land here.

No changes to `src/lib/sharedState.ts` (schema unchanged).
