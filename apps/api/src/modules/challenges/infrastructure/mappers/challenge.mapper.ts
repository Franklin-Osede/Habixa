import { Challenge } from '../../domain/challenge.entity';

export class ChallengeMapper {
  static toPersistence(challenge: Challenge) {
    return {
      userId: challenge.userId.toString(),
      challengeId: challenge.trackId, // TEMPORARY: Assuming trackId is the DB ID of the definition
      startDate: challenge.startDate,
      durationDays: challenge.durationDays,
      status: challenge.status,
      currentDay: challenge.currentDay,
    };
  }
}
