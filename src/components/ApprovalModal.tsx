import { useEffect, useRef, useState } from 'react';
import type { RecommendedAction } from '@/types';

interface ApprovalModalProps {
  open: boolean;
  actions: RecommendedAction[];
  onApprove: (selectedIds: string[]) => void;
  onReject: () => void;
  onClose: () => void;
}

export function ApprovalModal({ open, actions, onApprove, onReject, onClose }: ApprovalModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSelected(new Set(actions.filter((a) => a.defaultChecked).map((a) => a.id)));
    }
  }, [open, actions]);

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

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        className="border-2 border-amber bg-surface p-4 max-w-md w-full mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="approval-modal-title" className="text-[9px] text-amber mb-3 tracking-wide">
          ⚠ HUMAN APPROVAL REQUIRED
        </h2>

        {actions.length === 0 ? (
          <p className="text-[7px] text-muted mb-4 leading-relaxed">
            No remediation actions recommended. Confirm case closure?
          </p>
        ) : (
          <div className="space-y-2 mb-4">
            <p className="text-[7px] text-muted mb-2">Recommended remediation actions:</p>
            {actions.map((action) => (
              <label
                key={action.id}
                className="flex items-start gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selected.has(action.id)}
                  onChange={() => toggle(action.id)}
                  className="mt-0.5 accent-amber"
                  aria-label={`${action.label} for ${action.target}`}
                />
                <span className="text-[7px] text-body leading-relaxed group-hover:text-bright">
                  <span className="text-amber">{action.label}</span>
                  {' → '}
                  <span className="text-muted">{action.target}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        <p className="text-[6px] text-muted mb-4 italic">
          This action is logged and cannot be undone.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onApprove([...selected])}
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
