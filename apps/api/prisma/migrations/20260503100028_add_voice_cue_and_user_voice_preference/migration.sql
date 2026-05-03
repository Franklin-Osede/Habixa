-- CreateTable
CREATE TABLE "VoiceCue" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT,
    "cueKind" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "voicePersona" TEXT NOT NULL,
    "scriptText" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "durationMs" INTEGER,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceCue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVoicePreference" (
    "userId" TEXT NOT NULL,
    "voicePersona" TEXT NOT NULL DEFAULT 'lupe',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVoicePreference_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "VoiceCue_exerciseId_cueKind_idx" ON "VoiceCue"("exerciseId", "cueKind");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceCue_exerciseId_cueKind_locale_voicePersona_key" ON "VoiceCue"("exerciseId", "cueKind", "locale", "voicePersona");

-- AddForeignKey
ALTER TABLE "VoiceCue" ADD CONSTRAINT "VoiceCue_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVoicePreference" ADD CONSTRAINT "UserVoicePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
