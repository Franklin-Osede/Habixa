import { CoachService } from './coach.service';
import { CoachLlmStub, textTurn, toolUseTurn } from './coach-llm.stub';
import {
  CoachConversationStore,
  StoredCoachConversation,
  StoredCoachMessage,
} from './ports/coach-conversation.store';
import { CoachToolRegistry } from './coach-tool.registry';
import { CoachToolContext } from './tools/coach-tool.types';

class InMemoryCoachStore implements CoachConversationStore {
  private conversations = new Map<string, StoredCoachConversation>();
  private messages: StoredCoachMessage[] = [];
  private idCounter = 0;

  async findById(id: string, userId: string) {
    const c = this.conversations.get(id);
    if (!c || c.userId !== userId) return null;
    return c;
  }

  async createConversation(userId: string) {
    this.idCounter += 1;
    const conv: StoredCoachConversation = {
      id: `conv-${this.idCounter}`,
      userId,
      title: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.set(conv.id, conv);
    return conv;
  }

  async appendMessage(input: {
    conversationId: string;
    role: 'user' | 'assistant' | 'tool';
    content: string;
    metadata?: Record<string, unknown> | null;
  }) {
    this.idCounter += 1;
    const message: StoredCoachMessage = {
      id: `msg-${this.idCounter}`,
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      metadata: input.metadata ?? null,
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  async loadHistory(conversationId: string) {
    return this.messages.filter((m) => m.conversationId === conversationId);
  }

  // Test helper
  getAllMessages() {
    return [...this.messages];
  }
}

class FakeRegistry {
  // Mirrors CoachToolRegistry's surface but with scripted results.
  responses = new Map<string, unknown>();
  executions: Array<{ name: string; input: unknown; ctx: CoachToolContext }> = [];

  setResponse(name: string, value: unknown) {
    this.responses.set(name, value);
  }

  definitions() {
    return [
      {
        name: 'get_today_plan',
        description: 'today plan',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_adherence',
        description: 'adherence',
        inputSchema: { type: 'object', properties: {} },
      },
    ];
  }

  has(name: string) {
    return this.responses.has(name);
  }

  async execute(name: string, input: unknown, ctx: CoachToolContext) {
    this.executions.push({ name, input, ctx });
    if (!this.responses.has(name)) {
      throw new Error(`No scripted response for tool ${name}`);
    }
    return this.responses.get(name);
  }
}

const USER_ID = 'user-1';
const NOW = new Date('2026-05-03T08:00:00.000Z');

function makeService(
  llm: CoachLlmStub,
  store = new InMemoryCoachStore(),
  registry = new FakeRegistry(),
) {
  const service = new CoachService(
    llm,
    store,
    registry as unknown as CoachToolRegistry,
  );
  return { service, store, registry };
}

describe('CoachService.sendMessage', () => {
  describe('plain reply (no tool use)', () => {
    it('persists user + assistant messages and returns the text', async () => {
      const llm = new CoachLlmStub([textTurn('Hola, ¿en qué te ayudo?')]);
      const { service, store } = makeService(llm);

      const result = await service.sendMessage({
        userId: USER_ID,
        message: 'Hola',
        now: NOW,
      });

      expect(result.replyText).toBe('Hola, ¿en qué te ayudo?');
      expect(result.conversationId).toBeDefined();

      const messages = store.getAllMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Hola');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toBe('Hola, ¿en qué te ayudo?');
    });

    it('passes the system prompt and tool definitions to the LLM', async () => {
      const llm = new CoachLlmStub([textTurn('OK')]);
      const { service } = makeService(llm);

      await service.sendMessage({ userId: USER_ID, message: 'hi', now: NOW });

      expect(llm.receivedRequests).toHaveLength(1);
      const req = llm.receivedRequests[0];
      expect(req.systemPrompt).toContain('Habixa');
      expect(req.tools.map((t) => t.name)).toEqual(
        expect.arrayContaining(['get_today_plan', 'get_adherence']),
      );
    });
  });

  describe('tool-use loop', () => {
    it('executes the tool, feeds the result back, and returns the next text turn', async () => {
      const llm = new CoachLlmStub([
        toolUseTurn('call-1', 'get_today_plan', {}),
        textTurn('Hoy te toca pierna.'),
      ]);
      const { service, store, registry } = makeService(llm);
      registry.setResponse('get_today_plan', {
        status: 'READY',
        workout: { title: 'Leg Day' },
      });

      const result = await service.sendMessage({
        userId: USER_ID,
        message: '¿Qué entreno toca?',
        now: NOW,
      });

      expect(result.replyText).toBe('Hoy te toca pierna.');
      expect(registry.executions).toHaveLength(1);
      expect(registry.executions[0].name).toBe('get_today_plan');
      expect(registry.executions[0].ctx.userId).toBe(USER_ID);

      // Persisted: user, assistant(tool_use), tool, assistant(text)
      const messages = store.getAllMessages();
      const roles = messages.map((m) => m.role);
      expect(roles).toEqual(['user', 'assistant', 'tool', 'assistant']);
      expect(messages[1].metadata).toMatchObject({ stopReason: 'tool_use' });
      expect(messages[2].metadata).toMatchObject({
        toolName: 'get_today_plan',
        toolCallId: 'call-1',
      });
    });

    it('chains multiple tool calls before the final text turn', async () => {
      const llm = new CoachLlmStub([
        toolUseTurn('call-1', 'get_today_plan', {}),
        toolUseTurn('call-2', 'get_adherence', { rangeDays: 7 }),
        textTurn('Tu plan + tu racha al detalle.'),
      ]);
      const { service, registry } = makeService(llm);
      registry.setResponse('get_today_plan', { status: 'READY' });
      registry.setResponse('get_adherence', { streakDays: 5 });

      const result = await service.sendMessage({
        userId: USER_ID,
        message: 'Estado actual',
        now: NOW,
      });

      expect(result.replyText).toBe('Tu plan + tu racha al detalle.');
      expect(registry.executions.map((e) => e.name)).toEqual([
        'get_today_plan',
        'get_adherence',
      ]);
    });

    it('returns a tool error result when the tool throws', async () => {
      const llm = new CoachLlmStub([
        toolUseTurn('call-1', 'get_today_plan', {}),
        textTurn('Algo salió mal con tu plan.'),
      ]);
      const { service, registry } = makeService(llm);
      // Do NOT register get_today_plan -> the registry will throw.

      const result = await service.sendMessage({
        userId: USER_ID,
        message: 'plan?',
        now: NOW,
      });

      expect(result.replyText).toBe('Algo salió mal con tu plan.');
      // The error should have been fed back to the LLM as is_error tool_result.
      const followUpReq = llm.receivedRequests[1];
      const lastMessage =
        followUpReq.messages[followUpReq.messages.length - 1];
      expect(lastMessage.role).toBe('tool');
      const content = lastMessage.content as Array<{
        type: 'tool_result';
        is_error?: boolean;
      }>;
      expect(content[0].is_error).toBe(true);
    });

    it('aborts after the iteration cap (default 5) to avoid infinite loops', async () => {
      const llm = new CoachLlmStub([
        toolUseTurn('c1', 'get_today_plan', {}),
        toolUseTurn('c2', 'get_today_plan', {}),
        toolUseTurn('c3', 'get_today_plan', {}),
        toolUseTurn('c4', 'get_today_plan', {}),
        toolUseTurn('c5', 'get_today_plan', {}),
        toolUseTurn('c6', 'get_today_plan', {}),
      ]);
      const { service, registry } = makeService(llm);
      registry.setResponse('get_today_plan', { status: 'READY' });

      await expect(
        service.sendMessage({ userId: USER_ID, message: 'q', now: NOW }),
      ).rejects.toThrow(/iteration/i);
    });
  });

  describe('conversation continuity', () => {
    it('reuses an existing conversation and replays its history to the LLM', async () => {
      const llm = new CoachLlmStub([
        textTurn('First reply'),
        textTurn('Second reply'),
      ]);
      const { service, store } = makeService(llm);

      const first = await service.sendMessage({
        userId: USER_ID,
        message: 'Hi',
        now: NOW,
      });
      const second = await service.sendMessage({
        userId: USER_ID,
        conversationId: first.conversationId,
        message: 'Tell me more',
        now: NOW,
      });

      expect(second.conversationId).toBe(first.conversationId);
      // Second LLM call should include the first turn in messages.
      const secondCall = llm.receivedRequests[1];
      const userMessages = secondCall.messages.filter(
        (m) => m.role === 'user',
      );
      expect(userMessages).toHaveLength(2);

      const persisted = store.getAllMessages();
      // 2 user messages + 2 assistant messages = 4
      expect(persisted).toHaveLength(4);
    });

    it('rejects a conversationId that belongs to a different user', async () => {
      const llm = new CoachLlmStub([textTurn('hi')]);
      const { service, store } = makeService(llm);
      const other = await store.createConversation('user-2');

      await expect(
        service.sendMessage({
          userId: USER_ID,
          conversationId: other.id,
          message: 'sneak',
          now: NOW,
        }),
      ).rejects.toThrow(/not found/i);
    });
  });
});
