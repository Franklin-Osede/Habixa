import apiClient from './api.client';

export interface StartChallengeDto {
  durationDays: number;
  trackId: string;
}

export interface ChallengeResponse {
  id: string;
  status: string;
  durationDays: number;
  currentDay: number;
}

export const ChallengeService = {
  startChallenge: async (dto: StartChallengeDto): Promise<ChallengeResponse> => {
    const response = await apiClient.post('/challenges', dto);
    return response.data.challenge;
  },

  getActiveChallenge: async (): Promise<ChallengeResponse | null> => {
    try {
        const response = await apiClient.get('/challenges/active');
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
  }
};
