export type AgentRole = 'triage' | 'prosecutor' | 'defender' | 'judge' | 'orchestrator';

export type CaseStatus =
  | 'idle'
  | 'collecting'
  | 'arguing'
  | 'deliberating'
  | 'awaiting_approval'
  | 'closed';

export interface Evidence {
  id: string;
  text: string;
  citedBy?: AgentRole[];
}

export interface AgentMessage {
  agent: AgentRole;
  timestamp: string;
  text: string;
  evidenceCited: string[];
  mitre?: string;
  type?: 'argument' | 'rebuttal' | 'concede' | 'verdict';
}

export interface Claim {
  id: string;
  text: string;
  status: 'valid' | 'concede' | 'struck';
  madeBy: 'prosecutor' | 'defender';
}

export type VerdictDecision = 'REAL INCIDENT' | 'FALSE POSITIVE' | 'INVESTIGATE';

export interface Verdict {
  decision: VerdictDecision;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: string;
  reasoning: string[];
  recommendedActions: RecommendedAction[];
}

export interface RecommendedAction {
  id: string;
  label: string;
  target: string;
  defaultChecked: boolean;
}

export interface DemoScenario {
  caseId: string;
  alertName: string;
  evidence: Evidence[];
  messages: AgentMessage[];
  claims: Claim[];
  verdict: Verdict;
}

export const AGENT_COLORS: Record<AgentRole, string> = {
  orchestrator: '#e2e8f0',
  triage: '#60a5fa',
  prosecutor: '#f87171',
  defender: '#4ade80',
  judge: '#f59e0b',
};

export const AGENT_LABELS: Record<AgentRole, string> = {
  orchestrator: 'ORCHESTRATOR',
  triage: 'TRIAGE',
  prosecutor: 'PROSECUTOR',
  defender: 'DEFENDER',
  judge: 'JUDGE',
};
