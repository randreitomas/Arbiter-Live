/**
 * Human approval gate.
 *
 * The backend has no structured RecommendedAction list. The Judge's
 * impliedActions is best-effort free text (see INTEGRATION_NOTES.md).
 * This modal shows the full ruling and any implied actions, then
 * requires an explicit human approve/reject decision before case closure.
 * The approval gate itself is never removed — it is the entire point of
 * the human-in-the-loop requirement.
 */
import { useEffect, useRef } from 'react';
import type { Verdict } from '@/types';
import { VERDICT_LABELS, VERDICT_COLORS } from '@/types';

interface ApprovalModalProps {
  open: boolean;
  verdict: Verdict | null;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function ApprovalModal({ open, verdict, onApprove, onReject, onClose }: ApprovalModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || focusable.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const verdictColor = verdict ? VERDICT_COLORS[verdict.decision] : '#f59e0b';
  const verdictLabel = verdict ? VERDICT_LABELS[verdict.decision] : 'VERDICT';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="border-2 border-amber bg-surface p-4 max-w-lg w-full mx-4 shadow-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="approval-modal-title" className="text-[9px] text-amber mb-1 tracking-wide shrink-0">
          ⚠ HUMAN APPROVAL REQUIRED
        </h2>

        {verdict && (
          <p className="text-[8px] mb-3 shrink-0" style={{ color: verdictColor }}>
            {verdictLabel}
          </p>
        )}

        <div className="flex-1 overflow-y-auto mb-3 space-y-3">
          {/* Implied actions — best-effort extraction, clearly labelled */}
          {verdict?.impliedActions ? (
            <div className="border border-amber/30 bg-amber/5 px-2 py-2">
              <p className="text-[7px] text-amber mb-1 tracking-wide">
                IMPLIED ACTIONS (parsed from ruling — best-effort)
              </p>
              <p className="text-[7px] text-body leading-relaxed">{verdict.impliedActions}</p>
            </div>
          ) : (
            <div className="border border-border bg-surface px-2 py-2">
              <p className="text-[7px] text-muted leading-relaxed">
                No structured action list available. Review the full ruling below before deciding.
              </p>
            </div>
          )}

          {/* Full Judge ruling — verbatim */}
          {verdict?.reasoning && (
            <div>
              <p className="text-[7px] text-amber mb-1 tracking-wide">FULL RULING</p>
              <p className="text-[6px] text-muted leading-relaxed whitespace-pre-wrap">
                {verdict.reasoning}
              </p>
            </div>
          )}
        </div>

        <p className="text-[6px] text-muted mb-3 italic shrink-0">
          This decision is logged and cannot be undone. Nothing destructive executes without your sign-off.
        </p>

        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onApprove}
            className="flex-1 text-[7px] py-2 border border-green text-green hover:bg-green/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-green tracking-wide"
          >
            ✓ APPROVE
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex-1 text-[7px] py-2 border border-red text-red hover:bg-red/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-red tracking-wide"
          >
            ✗ REJECT
          </button>
        </div>
      </div>
    </div>
  );
}
