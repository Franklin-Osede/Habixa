import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';
import { GetSagaPathUseCase } from './application/get-saga-path.use-case';
import { CompleteSagaNodeUseCase } from './application/complete-saga-node.use-case';

interface RequestWithUser {
  user: { userId: string };
}

@ApiTags('Saga')
@Controller('saga')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SagaController {
  constructor(
    private readonly getPath: GetSagaPathUseCase,
    private readonly completeNode: CompleteSagaNodeUseCase,
  ) {}

  @Get('path')
  @ApiOperation({ summary: 'Get current user saga path (nodes, phase, current day)' })
  async getPathHandler(@Request() req: RequestWithUser) {
    const result = await this.getPath.execute({ userId: req.user.userId });
    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }
    return result.getValue();
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete current path day; awards XP and updates streak' })
  async completeHandler(@Request() req: RequestWithUser) {
    const result = await this.completeNode.execute({ userId: req.user.userId });
    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }
    return result.getValue();
  }
}
