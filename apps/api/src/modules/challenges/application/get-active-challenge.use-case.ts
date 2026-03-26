import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { Challenge } from '../domain/challenge.entity';
import { IChallengeRepository } from '../infrastructure/repositories/challenge.repository';

interface GetActiveChallengeDto {
  userId: string;
}

@Injectable()
export class GetActiveChallengeUseCase implements UseCase<
  GetActiveChallengeDto,
  Promise<Result<Challenge>>
> {
  constructor(
    @Inject('IChallengeRepository')
    private readonly challengeRepository: IChallengeRepository,
  ) {}

  async execute(request: GetActiveChallengeDto): Promise<Result<Challenge>> {
    const { userId } = request;

    try {
      const activeChallenge = await this.challengeRepository.findActiveByUserId(userId);

      if (!activeChallenge) {
        return Result.fail('No active challenge found for this user.');
      }

      return Result.ok(activeChallenge);
    } catch (err) {
      return Result.fail(
        `Failed to retrieve active challenge: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
