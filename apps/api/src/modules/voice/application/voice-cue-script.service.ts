import { Injectable } from '@nestjs/common';
import { SupportedLocale, VoicePersona } from './ports/tts.port';

export type CueKind =
  | 'intro'
  | 'mid_set'
  | 'last_rep'
  | 'rest_start'
  | 'morning_summary';

export interface CueScriptInput {
  kind: CueKind;
  locale: SupportedLocale;
  voicePersona: VoicePersona;
  // Optional context — when null we fall back to generic phrasing.
  exerciseName?: string;
  setNumber?: number;
  totalSets?: number;
  reps?: string;
  restSec?: number;
}

/**
 * Pure script generator. Returns the text that the TTS port will
 * synthesize. Kept separate from the cache/storage logic so we can
 * unit test the wording without mocks.
 *
 * Persona affects tone — Lupe is energetic ("¡Vamos!"), Sergio is
 * formal ("Adelante"), Mia is warm ("Tú puedes"). Locale only matters
 * for voice selection inside the TTS adapter; the Spanish text is
 * mostly the same across locales (we avoid regional slang).
 */
@Injectable()
export class VoiceCueScriptService {
  build(input: CueScriptInput): string {
    switch (input.kind) {
      case 'intro':
        return this.intro(input);
      case 'mid_set':
        return this.midSet(input);
      case 'last_rep':
        return this.lastRep(input);
      case 'rest_start':
        return this.restStart(input);
      case 'morning_summary':
        return this.morning(input);
    }
  }

  private intro(input: CueScriptInput): string {
    const exerciseName = input.exerciseName ?? 'tu ejercicio';
    const reps = input.reps ? `${input.reps} repeticiones` : 'la serie';
    const opener = this.persona(input.voicePersona, {
      lupe: '¡Empezamos!',
      sergio: 'Comenzamos.',
      mia: 'Vamos allá.',
    });
    return `${opener} Toca ${exerciseName}. ${reps} con buena técnica. ¡A por ello!`;
  }

  private midSet(input: CueScriptInput): string {
    return this.persona(input.voicePersona, {
      lupe: 'Mantén el control. Sigue así.',
      sergio: 'Mantén la técnica.',
      mia: 'Tú puedes con esto.',
    });
  }

  private lastRep(input: CueScriptInput): string {
    return this.persona(input.voicePersona, {
      lupe: '¡Última repetición! Dale todo.',
      sergio: 'Última repetición. Acaba bien.',
      mia: 'La última, con cariño y técnica.',
    });
  }

  private restStart(input: CueScriptInput): string {
    const seconds = input.restSec ?? 60;
    return this.persona(input.voicePersona, {
      lupe: `Descanso de ${seconds} segundos. Respira.`,
      sergio: `Descanso ${seconds} segundos.`,
      mia: `Tómate ${seconds} segundos. Respiración profunda.`,
    });
  }

  private morning(input: CueScriptInput): string {
    return this.persona(input.voicePersona, {
      lupe: 'Buenos días. Hoy vamos a por todas. Revisa tu plan y empezamos.',
      sergio: 'Buenos días. Tienes tu plan listo. Vamos a ello.',
      mia: 'Buenos días. Un nuevo día, un paso más. Aquí estoy contigo.',
    });
  }

  private persona<T>(
    persona: VoicePersona,
    options: Record<VoicePersona, T>,
  ): T {
    return options[persona];
  }
}
