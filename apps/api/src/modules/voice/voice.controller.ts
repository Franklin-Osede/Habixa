import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma.service';
import {
  CueKind,
  VoiceCueScriptService,
} from './application/voice-cue-script.service';
import { VoiceCueService } from './application/voice-cue.service';
import {
  SupportedLocale,
  VoicePersona,
} from './application/ports/tts.port';

const ALLOWED_KINDS: ReadonlyArray<CueKind> = [
  'intro',
  'mid_set',
  'last_rep',
  'rest_start',
  'morning_summary',
];
const ALLOWED_LOCALES: ReadonlyArray<SupportedLocale> = ['es-US', 'es-ES', 'es-MX'];
const ALLOWED_PERSONAS: ReadonlyArray<VoicePersona> = ['lupe', 'sergio', 'mia'];
const PERSONA_DEFAULT_LOCALE: Record<VoicePersona, SupportedLocale> = {
  lupe: 'es-US',
  sergio: 'es-ES',
  mia: 'es-MX',
};

@ApiTags('Voice')
@Controller('voice')
export class VoiceController {
  constructor(
    private readonly voiceCueService: VoiceCueService,
    private readonly scripts: VoiceCueScriptService,
    private readonly prisma: PrismaService,
  ) {
    void this.scripts;
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get (or generate) a voice cue audio URL',
    description:
      'Cache-aside lookup: if the (exerciseId, kind, locale, persona) tuple ' +
      'has already been synthesized the persisted public URL is returned ' +
      'immediately. Otherwise the service builds the script, calls Polly, ' +
      'uploads to Supabase Storage and persists the row. Defaults the ' +
      'persona to the user\'s preference (or "lupe" if unset).',
  })
  @Get('cue')
  async getCue(
    @Req() req: any,
    @Query('exerciseId') exerciseId: string | undefined,
    @Query('kind') kind: string | undefined,
    @Query('locale') localeRaw: string | undefined,
    @Query('persona') personaRaw: string | undefined,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');

    if (!kind || !ALLOWED_KINDS.includes(kind as CueKind)) {
      throw new BadRequestException(
        `kind is required and must be one of: ${ALLOWED_KINDS.join(', ')}`,
      );
    }
    const cueKind = kind as CueKind;

    let persona: VoicePersona;
    if (personaRaw) {
      if (!ALLOWED_PERSONAS.includes(personaRaw as VoicePersona)) {
        throw new BadRequestException(
          `persona must be one of: ${ALLOWED_PERSONAS.join(', ')}`,
        );
      }
      persona = personaRaw as VoicePersona;
    } else {
      const pref = await this.prisma.userVoicePreference.findUnique({
        where: { userId },
      });
      persona = (pref?.voicePersona as VoicePersona) ?? 'lupe';
    }

    let locale: SupportedLocale;
    if (localeRaw) {
      if (!ALLOWED_LOCALES.includes(localeRaw as SupportedLocale)) {
        throw new BadRequestException(
          `locale must be one of: ${ALLOWED_LOCALES.join(', ')}`,
        );
      }
      locale = localeRaw as SupportedLocale;
    } else {
      locale = PERSONA_DEFAULT_LOCALE[persona];
    }

    // Pull exercise context if a real exerciseId was provided so the
    // script template can address the user with the actual movement
    // name ("Goblet Squat") rather than the generic fallback.
    let exerciseName: string | undefined;
    if (exerciseId) {
      const exercise = await this.prisma.exercise.findUnique({
        where: { id: exerciseId },
        select: { name: true },
      });
      exerciseName = exercise?.name;
    }

    const result = await this.voiceCueService.getOrGenerate({
      exerciseId,
      cueKind,
      locale,
      voicePersona: persona,
      exerciseName,
    });

    return {
      audioUrl: result.audioUrl,
      scriptText: result.scriptText,
      durationMs: result.durationMs,
      voicePersona: persona,
      locale,
      cueKind,
      exerciseId: exerciseId ?? null,
    };
  }
}
