import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { IngestTextUseCase } from './application/ingest-text.use-case';
import { ListKnowledgeSnippetsUseCase } from './application/list-knowledge-snippets.use-case';
import { GetKnowledgeSnippetUseCase } from './application/get-knowledge-snippet.use-case';
import { DeleteKnowledgeSnippetUseCase } from './application/delete-knowledge-snippet.use-case';
import { PrismaKnowledgeRepository } from './infrastructure/repositories/prisma-knowledge.repository';
import { KnowledgeRepository } from './domain/repositories/knowledge.repository';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [KnowledgeController],
  providers: [
    PrismaService,
    IngestTextUseCase,
    ListKnowledgeSnippetsUseCase,
    GetKnowledgeSnippetUseCase,
    DeleteKnowledgeSnippetUseCase,
    {
      provide: KnowledgeRepository,
      useClass: PrismaKnowledgeRepository,
    },
  ],
  exports: [KnowledgeRepository, IngestTextUseCase],
})
export class KnowledgeModule {}
