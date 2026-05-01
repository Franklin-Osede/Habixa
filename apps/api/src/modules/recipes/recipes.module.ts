import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RecipesController } from './recipes.controller';

@Module({
  controllers: [RecipesController],
  providers: [PrismaService],
})
export class RecipesModule {}
