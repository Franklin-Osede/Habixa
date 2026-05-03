import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { VoiceController } from './voice.controller';
import {
  VoiceCueService,
  PrismaVoiceCueRepo,
} from './application/voice-cue.service';
import { VoiceCueScriptService } from './application/voice-cue-script.service';
import { TTS_PORT } from './application/ports/tts.port';
import { AUDIO_STORAGE_PORT } from './application/ports/audio-storage.port';
import { PollyTts } from './infrastructure/polly-tts';
import { SupabaseAudioStorage } from './infrastructure/supabase-audio-storage';

@Module({
  controllers: [VoiceController],
  providers: [
    PrismaService,
    VoiceCueScriptService,
    VoiceCueService,
    { provide: 'VOICE_CUE_REPO', useClass: PrismaVoiceCueRepo },
    { provide: TTS_PORT, useClass: PollyTts },
    { provide: AUDIO_STORAGE_PORT, useClass: SupabaseAudioStorage },
  ],
  exports: [VoiceCueService],
})
export class VoiceModule {}
