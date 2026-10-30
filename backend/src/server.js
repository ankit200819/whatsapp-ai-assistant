import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function startServer() {
  console.log(`[Server] Starting WhatsApp AI Assistant backend on Node.js ${process.version}...`);

  // Attempt database connection (graceful fallback if offline)
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`-----------------------------------------------------`);
    console.log(` WhatsApp AI Assistant is live!`);
    console.log(` Port:         ${config.port}`);
    console.log(` Web Chat UI:  http://localhost:${config.port}`);
    console.log(` Health Check: http://localhost:${config.port}/api/health`);
    console.log(` Webhook URL:  http://localhost:${config.port}/webhook`);
    console.log(` AI Provider:  ${config.ai.provider} (${config.ai.ollamaModel})`);
    console.log(`-----------------------------------------------------`);
  });

  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] Closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
