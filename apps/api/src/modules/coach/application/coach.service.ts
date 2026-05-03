import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CoachLlmContentBlock,
  CoachLlmInputMessage,
  CoachLlmPort,
  CoachLlmRequest,
  COACH_LLM_PORT,
} from './ports/coach-llm.port';
import {
  CoachConversationStore,
  COACH_CONVERSATION_STORE,
  StoredCoachMessage,
} from './ports/coach-conversation.store';
import { CoachToolRegistry } from './coach-tool.registry';

const SYSTEM_PROMPT = [
  'You are Habixa, a fitness and lifestyle companion. You speak Spanish by default unless the user clearly writes in English.',
  '',
  'Voice: warm, direct, evidence-based. You are a strength & conditioning coach plus a registered dietitian rolled into one. You celebrate wins and call out drift without lecturing.',
  '',
  'Grounding (CRITICAL):',
  "- ALWAYS call get_today_plan before commenting on today's session, meals or habits.",
  '- ALWAYS call get_adherence before talking about streak, consistency, skips or "how am I doing".',
  '- Never invent kcal targets, exercise names, ingredient lists or stats. If a tool would have the answer, call it.',
  '',
  'Limits:',
  '- You are NOT a doctor. If the user mentions injury pain, eating-disorder signals (vomiting, severe restriction, body dysmorphia), self-harm or mental-health crises, recommend they speak to a qualified professional and provide region-appropriate emergency resources.',
  '- Keep responses short (1-3 short paragraphs) unless the user explicitly asks for detail.',
].join('\n');

const MAX_ITERATIONS = 5;

interface SendMessageInput {
  userId: string;
  message: string;
  conversationId?: string;
  now: Date;
}

interface SendMessageResult {
  conversationId: string;
  replyText: string;
}

@Injectable()
export class CoachService {
  constructor(
    @Inject(COACH_LLM_PORT) private readonly llm: CoachLlmPort,
    @Inject(COACH_CONVERSATION_STORE)
    private readonly store: CoachConversationStore,
    private readonly tools: CoachToolRegistry,
  ) {}

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const conversation = await this.resolveConversation(
      input.userId,
      input.conversationId,
    );

    await this.store.appendMessage({
      conversationId: conversation.id,
      role: 'user',
      content: input.message,
    });

    const history = await this.store.loadHistory(conversation.id);
    const messages = this.historyToLlmMessages(history);

    let iteration = 0;
    while (iteration < MAX_ITERATIONS) {
      iteration += 1;

      const request: CoachLlmRequest = {
        systemPrompt: SYSTEM_PROMPT,
        // Snapshot the running messages array so the LLM port (and any
        // test stub) sees the state at call time, not after later
        // mutations within this iteration.
        messages: [...messages],
        tools: this.tools.definitions(),
        maxTokens: 1024,
      };
      const response = await this.llm.generate(request);

      // Persist the assistant turn (entire content block array).
      await this.store.appendMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: this.extractText(response.content),
        metadata: {
          stopReason: response.stopReason,
          blocks: response.content,
        },
      });

      // Echo the assistant blocks into the running message list so the
      // model sees its own previous turn on the next request.
      messages.push({ role: 'assistant', content: response.content });

      if (response.stopReason !== 'tool_use') {
        return {
          conversationId: conversation.id,
          replyText: this.extractText(response.content),
        };
      }

      // Run every tool_use block emitted in this turn, in order, then
      // append a single user-role message with all the tool_result blocks.
      const toolResults: Array<{
        type: 'tool_result';
        tool_use_id: string;
        content: string;
        is_error?: boolean;
      }> = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        let resultJson: string;
        let isError = false;
        try {
          const result = await this.tools.execute(block.name, block.input, {
            userId: input.userId,
            now: input.now,
          });
          resultJson = JSON.stringify(result);
        } catch (err) {
          isError = true;
          resultJson = JSON.stringify({
            error: err instanceof Error ? err.message : String(err),
          });
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: resultJson,
          is_error: isError,
        });

        await this.store.appendMessage({
          conversationId: conversation.id,
          role: 'tool',
          content: resultJson,
          metadata: {
            toolName: block.name,
            toolCallId: block.id,
            toolInput: block.input,
            isError,
          },
        });
      }

      messages.push({
        role: 'tool',
        content: toolResults,
      });
    }

    throw new Error(
      `CoachService: exceeded max iteration cap (${MAX_ITERATIONS})`,
    );
  }

  private async resolveConversation(userId: string, conversationId?: string) {
    if (!conversationId) {
      return this.store.createConversation(userId);
    }
    const existing = await this.store.findById(conversationId, userId);
    if (!existing) {
      throw new NotFoundException('Conversation not found');
    }
    return existing;
  }

  private historyToLlmMessages(
    history: StoredCoachMessage[],
  ): CoachLlmInputMessage[] {
    // Group sequential tool messages so they all live under a single
    // user-role tool_result block, the way Anthropic expects it.
    const messages: CoachLlmInputMessage[] = [];
    let pendingToolResults: Array<{
      type: 'tool_result';
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    }> = [];

    const flushTool = () => {
      if (pendingToolResults.length === 0) return;
      messages.push({ role: 'tool', content: pendingToolResults });
      pendingToolResults = [];
    };

    for (const msg of history) {
      if (msg.role === 'user') {
        flushTool();
        messages.push({ role: 'user', content: msg.content });
        continue;
      }
      if (msg.role === 'assistant') {
        flushTool();
        const blocks =
          (msg.metadata?.blocks as CoachLlmContentBlock[] | undefined) ?? [
            { type: 'text', text: msg.content } as CoachLlmContentBlock,
          ];
        messages.push({ role: 'assistant', content: blocks });
        continue;
      }
      // role === tool
      const toolCallId =
        (msg.metadata?.toolCallId as string | undefined) ?? '';
      pendingToolResults.push({
        type: 'tool_result',
        tool_use_id: toolCallId,
        content: msg.content,
        is_error: Boolean(msg.metadata?.isError),
      });
    }
    flushTool();
    return messages;
  }

  private extractText(content: CoachLlmContentBlock[]): string {
    return content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
  }
}
