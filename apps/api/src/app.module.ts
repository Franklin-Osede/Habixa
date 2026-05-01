import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ProfileModule } from './modules/profile/profile.module';
import { PlanningModule } from './modules/planning/planning.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { HabitsModule } from './modules/habits/habits.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { McpModule } from './modules/mcp/mcp.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { AdminModule } from './modules/admin/admin.module';
import { SagaModule } from './modules/saga/saga.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      },
    }),
    CommonModule,
    ChallengesModule,
    IdentityModule,
    AuthModule,
    ProfileModule,
    PlanningModule,
    RecipesModule,
    HabitsModule,
    KnowledgeModule,
    WorkoutsModule,
    McpModule,
    GamificationModule,
    SagaModule,
    EventEmitterModule.forRoot(),
    AdminModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 3,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
