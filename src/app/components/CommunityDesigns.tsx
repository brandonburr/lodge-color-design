"use client";

import { useState, useCallback } from "react";
import { SharedDesign } from "@/lib/sharedState";
import { ColorSelection, MCBI_COLORS, BuildingRegion } from "@/lib/colors";

interface CommunityDesignsProps {
  designs: SharedDesign[];
  username: string;
  onToggleVote: (designId: string) => void;
  onAddComment: (designId: string, text: string) => void;
  onLoadDesign: (colors: ColorSelection) => void;
  loading: boolean;
}

function colorName(hex: string): string {
  return MCBI_COLORS.find((c) => c.hex === hex)?.name || hex;
}

export default function CommunityDesigns({
  designs,
  username,
  onToggleVote,
  onAddComment,
  onLoadDesign,
  loading,
}: CommunityDesignsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const handleSubmitComment = useCallback(
    (designId: string) => {
      if (!commentText.trim()) return;
      onAddComment(designId, commentText.trim());
      setCommentText("");
    },
    [commentText, onAddComment]
  );

  if (loading) {
    return (
      <div className="text-sm text-gray-400 py-8 text-center">
        Loading community designs...
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic py-8 text-center">
        No shared designs yet. Be the first to share your color combination!
      </div>
    );
  }

  // Sort by most thumbs-up first, then newest
  const sorted = [...designs].sort(
    (a, b) => b.thumbsUp.length - a.thumbsUp.length || b.createdAt - a.createdAt
  );

  return (
    <div className="space-y-3">
      {sorted.map((design) => {
        const voted = design.thumbsUp.includes(username);
        const expanded = expandedId === design.id;

        return (
          <div
            key={design.id}
            className="border border-gray-200 rounded-lg bg-white overflow-hidden"
          >
            {/* Design header */}
            <div className="flex items-center gap-3 p-3">
              {/* Color swatches */}
              <div className="flex gap-0.5 shrink-0">
                {(["roof", "walls", "trim"] as BuildingRegion[]).map((r) => (
                  <div
                    key={r}
                    className={`w-6 h-10 ${r === "roof" ? "rounded-l" : ""} ${r === "trim" ? "rounded-r" : ""}`}
                    style={{ backgroundColor: design.colors[r] }}
                    title={`${r}: ${colorName(design.colors[r])}`}
                  />
                ))}
              </div>

              {/* Name & author */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {design.name}
                </div>
                <div className="text-xs text-gray-400">
                  by {design.createdBy} &middot;{" "}
                  {new Date(design.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Thumbs-up button */}
              <button
                onClick={() => onToggleVote(design.id)}
                disabled={!username}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                  voted
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={
                  !username
                    ? "Set your name first"
                    : voted
                    ? "Remove vote"
                    : "Vote for this design"
                }
              >
                <span>{voted ? "\u{1F44D}" : "\u{1F44D}\u{1F3FB}"}</span>
                <span className="font-medium">{design.thumbsUp.length}</span>
              </button>

              {/* Load button */}
              <button
                onClick={() => onLoadDesign(design.colors)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                Load
              </button>
            </div>

            {/* Voters list (if any) */}
            {design.thumbsUp.length > 0 && (
              <div className="px-3 pb-1 text-xs text-gray-400">
                Liked by: {design.thumbsUp.join(", ")}
              </div>
            )}

            {/* Comments toggle */}
            <div className="border-t border-gray-100">
              <button
                onClick={() => setExpandedId(expanded ? null : design.id)}
                className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              >
                {design.comments.length === 0
                  ? "Add a comment..."
                  : `${design.comments.length} comment${design.comments.length === 1 ? "" : "s"} ${expanded ? "▲" : "▼"}`}
              </button>
            </div>

            {/* Expanded comments */}
            {expanded && (
              <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-2">
                {design.comments.map((c) => (
                  <div key={c.id} className="text-sm">
                    <span className="font-medium text-gray-700">{c.author}</span>
                    <span className="text-gray-400 text-xs ml-1">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    <p className="text-gray-600 mt-0.5">{c.text}</p>
                  </div>
                ))}

                {/* New comment input */}
                {username ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSubmitComment(design.id)
                      }
                      placeholder="Write a comment..."
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <button
                      onClick={() => handleSubmitComment(design.id)}
                      disabled={!commentText.trim()}
                      className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Post
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic mt-2">
                    Set your name above to comment.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
