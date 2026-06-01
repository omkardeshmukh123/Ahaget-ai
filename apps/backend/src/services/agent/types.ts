export type AgentAction =
  | { type: 'ask_clarification'; question: string; options?: string[] }
  | { type: 'execute_page_action'; actionType: string; payload: Record<string, unknown>; message: string; shouldVerify?: boolean }
  | { type: 'complete_step'; message: string; collectedData?: Record<string, unknown> }
  | { type: 'celebrate_milestone'; headline: string; insight: string }
  | { type: 'call_api'; url: string; method: string; reason: string }
  | { type: 'escalate_to_human'; reason: string; trigger: string; message: string }
  | { type: 'chat'; content: string }
  | { type: 'goal_complete'; summary: string }
  | { type: 'degrade_to_manual'; instruction: string; reason: string }
  | { type: 'suggest_upgrade'; plan: string; headline: string; pitch: string; upgradeUrl: string; flowId: string }
  | { type: 'tool_pending'; jobId: string; toolName: string };

export interface PageContext {
  url: string;
  title: string;
  headings: string[];
  elements: Array<{
    tag: string; selector: string; text: string; type?: string;
    value?: string;
    checked?: boolean;
    disabled?: boolean;
    selectedText?: string;
  }>;
  semanticSummary?: string;
  modalContext?: {
    title: string;
    elements: Array<{
      tag: string; selector: string; text: string; type?: string;
      value?: string; checked?: boolean; disabled?: boolean; selectedText?: string;
    }>;
  } | null;
  recentDomEvents?: string[];
  validationErrors?: string[];
}

export interface GoalPlanPhase {
  id: string;
  title: string;
  description: string;
}

export interface GoalTurn {
  role: 'user' | 'assistant' | 'observe' | 'degrade';
  content: string;
}
