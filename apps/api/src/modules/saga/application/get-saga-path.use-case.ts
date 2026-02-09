import { Injectable, Inject } from '@nestjs/common';
import { Result } from '../../../shared/domain/result';
import type { SagaPathStateDto } from '../domain/path-node.types';
import { buildPathNodes } from '../domain/saga-path.domain';
import type { SagaPathPort } from '../domain/repositories/saga-path.port';

export interface GetSagaPathDto {
  userId: string;
}

@Injectable()
export class GetSagaPathUseCase {
  constructor(
    @Inject('SagaPathPort') private readonly sagaPathPort: SagaPathPort,
  ) {}

  async execute(dto: GetSagaPathDto): Promise<Result<SagaPathStateDto>> {
    const data = await this.sagaPathPort.getPathForUser(dto.userId);
    if (!data) {
      return Result.fail('No path found for user');
    }
    const nodes = buildPathNodes(data.tasks, data.currentDayIndex);
    const state: SagaPathStateDto = {
      phaseLabel: data.phaseLabel,
      phaseNumber: data.phaseNumber,
      currentDayIndex: data.currentDayIndex,
      nodes,
    };
    return Result.ok(state);
  }
}
