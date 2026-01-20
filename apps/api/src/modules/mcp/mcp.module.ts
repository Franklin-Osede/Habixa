import { Module } from '@nestjs/common';
import { McpService } from './mcp.service';
import { HabitsModule } from '../habits/habits.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
// Import other modules as needed for tools

@Module({
  imports: [HabitsModule, KnowledgeModule],
  providers: [McpService],
  exports: [McpService],
})
export class McpModule {}
