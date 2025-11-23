"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteIdea } from "../api";

interface DeleteIdeaButtonProps {
  ideaId: string;
  ideaText: string;
  onDeleteSuccess?: () => void;
  variant?: "panel" | "card";
}

/**
 * Delete Idea Button with confirmation dialog
 * Shows a confirmation modal before deleting an idea
 */
export const DeleteIdeaButton: React.FC<DeleteIdeaButtonProps> = ({
  ideaId,
  ideaText,
  onDeleteSuccess,
  variant = "panel",
}) => {
  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteIdea(ideaId);

      // Call success callback if provided
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        // Default behavior: redirect to dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Failed to delete idea:", err);
      setError(err instanceof Error ? err.message : "Failed to delete idea");
      setIsDeleting(false);
    }
  };

  const truncatedText =
    ideaText.length > 100 ? `${ideaText.substring(0, 100)}...` : ideaText;

  if (variant === "card") {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirmation(true);
          }}
          className="px-3 py-1 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors rounded font-mono uppercase tracking-wider"
          disabled={isDeleting}
        >
          Delete
        </button>

        {showConfirmation && (
          <ConfirmationDialog
            ideaText={truncatedText}
            isDeleting={isDeleting}
            error={error}
            onConfirm={handleDelete}
            onCancel={() => {
              setShowConfirmation(false);
              setError(null);
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirmation(true)}
        className="px-6 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors rounded-none font-bold uppercase tracking-wider border border-red-500/30"
        disabled={isDeleting}
      >
        Delete Idea
      </button>

      {showConfirmation && (
        <ConfirmationDialog
          ideaText={truncatedText}
          isDeleting={isDeleting}
          error={error}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowConfirmation(false);
            setError(null);
          }}
        />
      )}
    </>
  );
};

interface ConfirmationDialogProps {
  ideaText: string;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  ideaText,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-slate-900 border-2 border-red-500 p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-red-400 mb-4 uppercase tracking-wider">
          Confirm Deletion
        </h3>

        <p className="text-slate-300 mb-4 font-mono">
          Are you sure you want to delete this idea and all its associated
          analyses? This action cannot be undone.
        </p>

        <div className="bg-slate-800 p-3 mb-4 border border-slate-700">
          <p className="text-sm text-slate-400 font-mono italic">
            &quot;{ideaText}&quot;
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 p-3 mb-4">
            <p className="text-sm text-red-400 font-mono">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors font-mono uppercase tracking-wider disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors font-bold uppercase tracking-wider disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteIdeaButton;
