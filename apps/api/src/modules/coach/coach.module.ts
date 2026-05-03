import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CoachController } from './coach.controller';
import { CoachService } from './application/coach.service';
import { CoachToolRegistry } from './application/coach-tool.registry';
import { GetTodayPlanTool } from './application/tools/get-today-plan.tool';
import { GetAdherenceTool } from './application/tools/get-adherence.tool';
import { COACH_LLM_PORT } from './application/ports/coach-llm.port';
import { COACH_CONVERSATION_STORE } from './application/ports/coach-conversation.store';
import { AnthropicCoachLlm } from './infrastructure/anthropic-coach-llm';
import { OpenAiCoachLlm } from './infrastructure/openai-coach-llm';
import { PrismaCoachConversationStore } from './infrastructure/prisma-coach-conversation.store';
import { MeModule } from '../me/me.module';

/**
 * Pick the coach LLM provider via the COACH_PROVIDER env var.
 * Defaults to "openai" because (a) gpt-4o-mini is the cheapest sane
 * option for early-stage usage, (b) the OPENAI_API_KEY is already in
 * .env for the recipe / exercise seed scripts. Set "anthropic" once
 * you have an ANTHROPIC_API_KEY and want Sonnet/Haiku quality.
 */
const llmProvider =
  process.env.COACH_PROVIDER === 'anthropic'
    ? AnthropicCoachLlm
    : OpenAiCoachLlm;

@Module({
  imports: [MeModule],
  controllers: [CoachController],
  providers: [
    PrismaService,
    CoachService,
    CoachToolRegistry,
    GetTodayPlanTool,
    GetAdherenceTool,
    AnthropicCoachLlm,
    OpenAiCoachLlm,
    { provide: COACH_LLM_PORT, useClass: llmProvider },
    { provide: COACH_CONVERSATION_STORE, useClass: PrismaCoachConversationStore },
  ],
})
export class CoachModule {}
