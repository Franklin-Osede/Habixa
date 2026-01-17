import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ProfileModule } from './modules/profile/profile.module';

import { PlanningModule } from './modules/planning/planning.module';

@Module({
  imports: [CommonModule, IdentityModule, ProfileModule, PlanningModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
