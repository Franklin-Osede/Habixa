import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ProfileModule } from './modules/profile/profile.module';
import { PlanningModule } from './modules/planning/planning.module';
import { HabitsModule } from './modules/habits/habits.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { McpModule } from './modules/mcp/mcp.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';

@Module({
  imports: [
    CommonModule,
    IdentityModule,
    AuthModule,
    ProfileModule,
    PlanningModule,
    HabitsModule,
    KnowledgeModule,
    WorkoutsModule,
    McpModule,
    GamificationModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
