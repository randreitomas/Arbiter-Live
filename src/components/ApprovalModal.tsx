/**
 * Human approval gate.
 *
 * The backend has no structured RecommendedAction list. The Judge's
 * impliedActions is best-effort free text (see INTEGRATION_NOTES.md).
 * This modal shows the full ruling and any implied actions, then
 * requires an explicit human approve/reject decision before case closure.
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
    focusable[0]?.focus();
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || focusable.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const verdictColor = verdict ? VERDICT_COLORS[verdict.decision] : '#f59e0b';
  const verdictLabel = verdict ? VERDICT_LABELS[verdict.decision] : 'Verdict';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="panel border border-border-2 max-w-lg w-full mx-4 shadow-2xl max-h-[82vh] flex flex-col"
        style={{ borderTopColor: verdictColor, borderTopWidth: '2px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between mb-1">
            <h2 id="approval-modal-title" className="text-[11px] font-semibold text-bright tracking-wide">
              Human Approval Required
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-bright transition-colors text-sm leading-none ml-3"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          {verdict && (
            <p className="text-sm font-bold" style={{ color: verdictColor }}>
              {verdictLabel}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {verdict?.impliedActions ? (
            <div className="border border-amber/25 bg-amber/5 rounded-lg px-4 py-3">
              <p className="text-[10px] text-amber font-medium uppercase tracking-widest mb-2">
                Implied Actions <span className="text-muted normal-case">(parsed — best-effort)</span>
              </p>
              <p className="text-xs text-body leading-relaxed">{verdict.impliedActions}</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg px-4 py-3">
              <p className="text-xs text-muted leading-relaxed">
                No structured action list available. Review the full ruling below before deciding.
              </p>
            </div>
          )}

          {verdict?.reasoning && (
            <div>
              <p className="text-[10px] text-muted uppercase tracking-widest mb-2">Full Ruling</p>
              <p className="text-xs text-body leading-relaxed whitespace-pre-wrap bg-surface-2 rounded-lg px-4 py-3 border border-border">
                {verdict.reasoning}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border shrink-0">
          <p className="text-[10px] text-muted mb-3">
            This decision is logged. No destructive action executes without your sign-off.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onApprove}
              className="flex-1 text-xs font-medium py-2.5 border border-green/60 text-green rounded-lg hover:bg-green/10 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-green"
            >
              ✓ Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              className="flex-1 text-xs font-medium py-2.5 border border-red/60 text-red rounded-lg hover:bg-red/10 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-red"
            >
              ✗ Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
