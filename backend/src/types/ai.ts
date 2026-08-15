export type MessageRole = 'user' | 'assistant' | 'system';

export interface AIMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  dataset_id?: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIAskRequest {
  datasetId: string;
  question: string;
  conversationId?: string;
}

export interface AIAskResponse {
  answer: string;
  confidence: number;
  sources: string[];
  analysis: Record<string, unknown>;
  conversationId: string;
  messageId: string;
}

export interface AIExecutiveSummaryResponse {
  summary: string;
  keyInsights: Array<{
    title: string;
    description: string;
    type: string;
  }>;
  recommendations: string[];
  confidence: number;
}
