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
import { PrismaCoachConversationStore } from './infrastructure/prisma-coach-conversation.store';
import { MeModule } from '../me/me.module';

@Module({
  imports: [MeModule],
  controllers: [CoachController],
  providers: [
    PrismaService,
    CoachService,
    CoachToolRegistry,
    GetTodayPlanTool,
    GetAdherenceTool,
    { provide: COACH_LLM_PORT, useClass: AnthropicCoachLlm },
    { provide: COACH_CONVERSATION_STORE, useClass: PrismaCoachConversationStore },
  ],
})
export class CoachModule {}
