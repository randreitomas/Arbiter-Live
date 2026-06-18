import { create } from 'zustand';
import type {
  AgentMessage,
  AgentRole,
  CaseStatus,
  Claim,
  Evidence,
  Verdict,
} from '@/types';

interface CaseState {
  caseId: string;
  alertName: string;
  status: CaseStatus;
  statusLabel: string;
  statusColor: string;

  evidence: Evidence[];
  messages: AgentMessage[];
  claims: Claim[];
  verdict: Verdict | null;
  activeAgents: AgentRole[];
  highlightedEvidence: string[];

  isTyping: boolean;
  modalOpen: boolean;
  caseClosed: boolean;
  caseOutcome: 'approved' | 'rejected' | null;

  /** Non-null when an [AGENT_ERROR] or case-halt arrives from the bridge. */
  caseError: string | null;

  isDemoMode: boolean;
  selectedScenario: number;

  setScenario: (idx: number) => void;
  addEvidence: (ev: Evidence) => void;
  addMessage: (msg: AgentMessage) => void;
  addClaim: (claim: Claim) => void;
  setVerdict: (verdict: Verdict) => void;
  setActiveAgents: (agents: AgentRole[]) => void;
  setHighlightedEvidence: (ids: string[]) => void;
  setStatus: (status: CaseStatus, label: string, color: string) => void;
  setTyping: (val: boolean) => void;
  setCaseError: (message: string) => void;
  openModal: () => void;
  closeModal: () => void;
  approveCase: () => void;
  rejectCase: () => void;
  resetCase: () => void;
}

const initialState = {
  caseId: '',
  alertName: '',
  status: 'idle' as CaseStatus,
  statusLabel: 'STANDBY',
  statusColor: '#64748b',
  evidence: [] as Evidence[],
  messages: [] as AgentMessage[],
  claims: [] as Claim[],
  verdict: null as Verdict | null,
  activeAgents: [] as AgentRole[],
  highlightedEvidence: [] as string[],
  isTyping: false,
  modalOpen: false,
  caseClosed: false,
  caseOutcome: null as 'approved' | 'rejected' | null,
  caseError: null as string | null,
  isDemoMode: import.meta.env.VITE_DEMO_MODE === 'true',
  selectedScenario: 1,
};

export const useCaseStore = create<CaseState>((set) => ({
  ...initialState,

  setScenario: (idx) =>
    set({
      ...initialState,
      isDemoMode: import.meta.env.VITE_DEMO_MODE === 'true',
      selectedScenario: idx,
    }),

  addEvidence: (ev) =>
    set((state) => ({
      evidence: state.evidence.find((e) => e.evidence_id === ev.evidence_id)
        ? state.evidence
        : [...state.evidence, ev],
    })),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  addClaim: (claim) =>
    set((state) => ({
      claims: [...state.claims, claim],
    })),

  setVerdict: (verdict) => set({ verdict }),

  setActiveAgents: (agents) => set({ activeAgents: agents }),

  setHighlightedEvidence: (ids) => set({ highlightedEvidence: ids }),

  setStatus: (status, label, color) => set({ status, statusLabel: label, statusColor: color }),

  setTyping: (val) => set({ isTyping: val }),

  setCaseError: (message) =>
    set({
      caseError: message,
      status: 'error',
      statusLabel: 'AGENT ERROR',
      statusColor: '#f87171',
    }),

  openModal: () => set({ modalOpen: true }),

  closeModal: () => set({ modalOpen: false }),

  approveCase: () =>
    set({
      modalOpen: false,
      caseClosed: true,
      caseOutcome: 'approved',
      status: 'closed',
      statusLabel: 'CASE CLOSED',
      statusColor: '#4ade80',
    }),

  rejectCase: () =>
    set({
      modalOpen: false,
      caseClosed: true,
      caseOutcome: 'rejected',
      status: 'closed',
      statusLabel: 'REJECTED',
      statusColor: '#f87171',
    }),

  resetCase: () =>
    set((state) => ({
      ...initialState,
      isDemoMode: state.isDemoMode,
      selectedScenario: state.selectedScenario,
    })),
}));
