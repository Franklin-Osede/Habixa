import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CreateHabitUseCase } from '../habits/application/create-habit.use-case';
import { IngestTextUseCase } from '../knowledge/application/ingest-text.use-case';
import { CreateHabitDto } from '../habits/application/dtos/create-habit.dto';
import { SnippetSource } from '../knowledge/domain/knowledge-snippet.entity';

interface CreateHabitArgs {
  title: string;
  description: string;
  frequency: 'daily' | 'weekly';
  userId: string;
}

interface IngestKnowledgeArgs {
  content: string;
  source?: string;
  tags?: string[];
  userId: string;
}

@Injectable()
export class McpService implements OnModuleInit {
  private server: Server;

  constructor(
    private readonly createHabitUseCase: CreateHabitUseCase,
    private readonly ingestTextUseCase: IngestTextUseCase,
  ) {
    this.server = new Server(
      {
        name: 'habixa-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );
  }

  onModuleInit() {
    this.setupTools();
  }

  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Habixa MCP Server running on stdio');
  }

  private setupTools() {
    // List Tools
    this.server.setRequestHandler(ListToolsRequestSchema, () => {
      return Promise.resolve({
        tools: [
          {
            name: 'create_habit',
            description: 'Create a new daily or weekly habit for the user.',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Title of the habit' },
                description: { type: 'string', description: 'Description' },
                frequency: { type: 'string', enum: ['daily', 'weekly'] },
                userId: {
                  type: 'string',
                  description: 'User ID owner of the habit',
                },
              },
              required: ['title', 'frequency', 'userId'],
            },
          },
          {
            name: 'ingest_knowledge',
            description:
              'Save a text snippet or note to the Second Brain knowledge base.',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'The text content to save',
                },
                source: {
                  type: 'string',
                  description: 'Source (manual, url, etc)',
                },
                tags: { type: 'array', items: { type: 'string' } },
                userId: { type: 'string' },
              },
              required: ['content', 'userId'],
            },
          },
        ],
      });
    });

    // Call Tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'create_habit': {
            const args = request.params.arguments as unknown as CreateHabitArgs;
            const dto: CreateHabitDto = {
              title: args.title,
              description: args.description,
              frequency: args.frequency,
              userId: args.userId,
            };

            const result = await this.createHabitUseCase.execute(dto);
            if (result.isFailure) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Error: ${JSON.stringify(result.error)}`,
                  },
                ],
                isError: true,
              };
            }
            return {
              content: [
                {
                  type: 'text',
                  text: `Habit created: ${result.getValue().title}`,
                },
              ],
            };
          }

          case 'ingest_knowledge': {
            const args = request.params
              .arguments as unknown as IngestKnowledgeArgs;
            const result = await this.ingestTextUseCase.execute({
              content: args.content,
              source: (args.source as SnippetSource) || 'manual',
              tags: args.tags || [],
              userId: args.userId,
            });

            if (result.isFailure) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Error: ${JSON.stringify(result.error)}`,
                  },
                ],
                isError: true,
              };
            }
            return {
              content: [
                {
                  type: 'text',
                  text: `Knowledge ingested. ID: ${result.getValue().id.toString()}`,
                },
              ],
            };
          }

          default:
            throw new Error('Unknown tool');
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);
        return {
          content: [{ type: 'text', text: `Exception: ${message}` }],
          isError: true,
        };
      }
    });
  }
}
