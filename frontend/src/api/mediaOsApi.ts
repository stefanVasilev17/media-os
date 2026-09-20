export type Proposal = {
  id: string;
  title: string;
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  affectedObjects: string[];
  proposedOperations: string[];
  status: string;
};

export type ThreadView = {
  episodeNumber: string;
  episodeTitle: string;
  agentName: string;
  agentStatus: string;
  messages: Array<{ id: string; sender: 'CREATOR' | 'AGENT' | 'SYSTEM'; content: string }>;
  proposal: Proposal;
};

const fallback: ThreadView = {
  episodeNumber: 'EP001',
  episodeTitle: 'What Really Happens When You Click Login?',
  agentName: 'Spline Agent',
  agentStatus: 'READY FOR REVIEW',
  messages: [
    { id: 'm1', sender: 'AGENT', content: 'I reviewed the approved Session Restore flow. I can reproduce the next animation using existing components only.' },
    { id: 'm2', sender: 'SYSTEM', content: 'Master scene is protected. Execution will target a sandbox copy.' }
  ],
  proposal: {
    id: 'proposal-demo',
    title: 'Restore Session Flow',
    summary: 'Reuse the approved restore path and camera grammar without introducing new hero components.',
    riskLevel: 'LOW',
    confidence: 0.92,
    affectedObjects: ['SessionRestore_ICON', 'RestoreToAuthState_PATH', 'AuthState'],
    proposedOperations: [
      'Keep image assets static',
      'Animate the restore flow only',
      'Reuse the approved camera behavior',
      'Generate a review preview before any master change'
    ],
    status: 'READY_FOR_REVIEW'
  }
};

export async function loadSplineThread(): Promise<ThreadView> {
  try {
    const response = await fetch('/api/v1/episodes/EP001/agents/spline');
    if (!response.ok) throw new Error('Backend not available');
    return await response.json();
  } catch {
    return fallback;
  }
}

export async function decideProposal(proposalId: string, decision: 'APPROVE' | 'REQUEST_CHANGES', comment?: string) {
  const response = await fetch(`/api/v1/proposals/${proposalId}/decisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, comment: comment ?? null })
  });
  if (!response.ok) throw new Error('Decision could not be saved');
  return response.json();
}
