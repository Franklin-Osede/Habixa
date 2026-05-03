/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import {
  CoachLlmContentBlock,
  CoachLlmPort,
  CoachLlmRequest,
  CoachLlmResponse,
} from '../application/ports/coach-llm.port';

/**
 * Production CoachLlmPort backed by the Anthropic SDK.
 *
 * Defaults to claude-sonnet-4-6 because (a) it's the latest non-Opus
 * model with native tool use, (b) latency is meaningfully lower than
 * Opus on a chat surface, and (c) cost is well-suited for a coach that
 * may answer many short messages per user per day. Switch to
 * claude-opus-4-7 by setting the COACH_MODEL env var if a user-specific
 * conversation needs deeper reasoning.
 */
@Injectable()
export class AnthropicCoachLlm implements CoachLlmPort {
  private readonly logger = new Logger(AnthropicCoachLlm.name);
  private readonly client: Anthropic;
  private readonly model: string;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
      this.logger.warn(
        'No ANTHROPIC_API_KEY in env — coach calls will fail until one is set.',
      );
    }
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = process.env.COACH_MODEL ?? 'claude-sonnet-4-6';
  }

  async generate(request: CoachLlmRequest): Promise<CoachLlmResponse> {
    const messages = request.messages.map((m) => {
      // Anthropic doesn't have a 'tool' role at the message level — tool
      // results are user-role messages whose content is a tool_result block.
      if (m.role === 'tool') {
        return { role: 'user', content: m.content as never };
      }
      return { role: m.role, content: m.content as never };
    });

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: request.maxTokens ?? 1024,
      system: request.systemPrompt,
      tools: request.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema as never,
      })),
      messages: messages as never,
    });

    const blocks: CoachLlmContentBlock[] = response.content.map((block) => {
      if (block.type === 'text') {
        return { type: 'text', text: block.text };
      }
      if (block.type === 'tool_use') {
        return {
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: (block.input ?? {}) as Record<string, unknown>,
        };
      }
      // Fallback: serialize anything unexpected as text so the loop keeps moving.
      return { type: 'text', text: JSON.stringify(block) };
    });

    return {
      stopReason: response.stop_reason ?? 'end_turn',
      content: blocks,
    };
  }
}
