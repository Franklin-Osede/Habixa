import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { OpenClawPort } from '../../application/ports/openclaw.port';
import {
  OpenClawRequestDto,
  OpenClawResponseDto,
} from '../../application/openclaw/openclaw.dto';

@Injectable()
export class OpenClawHttpClient implements OpenClawPort {
  private readonly logger = new Logger(OpenClawHttpClient.name);

  // Hardcoded for MVP, in production this should be in .env (e.g., configService.get('OPENCLAW_API_URL'))
  private readonly apiUrl =
    process.env.OPENCLAW_API_URL || 'http://localhost:8000';

  async generatePlan(
    request: OpenClawRequestDto,
  ): Promise<OpenClawResponseDto> {
    this.logger.log(
      `Sending plan generation request to OpenClaw for user ${request.userId}...`,
    );

    try {
      const response = await axios.post<OpenClawResponseDto>(
        `${this.apiUrl}/generate`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      this.logger.log(`Plan generation completed for user ${request.userId}`);
      return response.data;
    } catch (error: any) {
      this.logger.warn(`OpenClaw failed: ${error.message}. Attempting OpenAI Fallback...`);
      if (process.env.OPENAI_API_KEY) {
          return this.generateOpenAIFallback(request);
      }
      throw error;
    }
  }

  private async generateOpenAIFallback(request: OpenClawRequestDto): Promise<OpenClawResponseDto> {
      this.logger.log(`Using OpenAI directly to generate plan for ${request.userId}`);
      
      const exercises = request.context.availableCatalog.exercises.map(e => e.id).slice(0, 50).join(', ');
      const recipes = request.context.availableCatalog.recipes.map(r => r.id).slice(0, 50).join(', ');
      
      const prompt = `You are a fitness expert AI. Generate a 7-day lifestyle plan for a user.
User Profile:
- Goals: ${request.context.userProfile.goals.join(', ')}
- Experience: ${request.context.userProfile.experienceLevel}
- Equipment: ${request.context.userProfile.equipment}
- Diet: ${request.context.preferences.dietType}
- Meals/Day: ${request.context.preferences.mealsPerDay}

IMPORTANT: You must use ONLY the following IDs for exercises and recipes:
Exercises: ${exercises}
Recipes: ${recipes}

Return ONLY a raw JSON string matching exactly this format (no markdown, no backticks):
{
  "status": "success",
  "plan": {
    "days": [
      {
        "dayIndex": 1,
        "dailyTip": "Stay hydrated",
        "workout": {
          "title": "Full Body",
          "blocks": [
            {
              "type": "Strength",
              "exercises": [ { "exerciseId": "ID_FROM_LIST", "sets": 3, "reps": "10-12" } ]
            }
          ]
        },
        "nutrition": {
          "totalKcalTarget": 2200,
          "meals": [ { "mealType": "Breakfast", "recipeId": "ID_FROM_LIST" } ]
        }
      }
    ]
  }
}
Generate all 7 days (dayIndex 1 to 7).`;

      const res = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
              model: 'gpt-4o-mini',
              messages: [{ role: 'system', content: prompt }],
              temperature: 0.7,
              response_format: { type: 'json_object' }
          },
          {
              headers: {
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                  'Content-Type': 'application/json'
              },
              timeout: 60000
          }
      );

      const content = res.data.choices[0].message.content;
      return JSON.parse(content) as OpenClawResponseDto;
  }
}
