/**
 * Persistence boundary for coach conversations. Lets the orchestration
 * service stay free of Prisma so its unit tests can run with an in-memory
 * implementation and the real PrismaCoachConversationStore covers the
 * production path via integration tests.
 */

export interface StoredCoachMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface StoredCoachConversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const COACH_CONVERSATION_STORE = Symbol('COACH_CONVERSATION_STORE');

export interface CoachConversationStore {
  /** Find the conversation if it belongs to the user, else null. */
  findById(
    conversationId: string,
    userId: string,
  ): Promise<StoredCoachConversation | null>;

  createConversation(userId: string): Promise<StoredCoachConversation>;

  appendMessage(input: {
    conversationId: string;
    role: 'user' | 'assistant' | 'tool';
    content: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<StoredCoachMessage>;

  loadHistory(conversationId: string): Promise<StoredCoachMessage[]>;
}
