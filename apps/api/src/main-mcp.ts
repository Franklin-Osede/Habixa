import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { McpService } from './modules/mcp/mcp.service';

async function bootstrap() {
  // Create application context (no HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'], // Minimize logs to stdout to avoid corrupting MCP JSON messages
  });

  const mcpService = app.get(McpService);
  await mcpService.start();
}

bootstrap().catch((err) => {
  console.error('MCP Server failed to start:', err);
  process.exit(1);
});
