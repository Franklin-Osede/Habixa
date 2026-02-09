import { Challenge } from '../../domain/challenge.entity';

export interface IChallengeRepository {
  save(challenge: Challenge): Promise<void>;
  findById(id: string): Promise<Challenge | null>;
  findActiveByUserId(userId: string): Promise<Challenge | null>;
}
