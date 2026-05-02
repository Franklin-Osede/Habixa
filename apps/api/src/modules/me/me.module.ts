import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { MeController } from './me.controller';
import { AdherenceService } from './adherence/adherence.service';

@Module({
  controllers: [MeController],
  providers: [PrismaService, AdherenceService],
  exports: [AdherenceService],
})
export class MeModule {}
