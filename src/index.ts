import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { initializeHederaClient } from './config/hedera';
import { loadAllAbilities } from './agent/tools/abilityLoader';
import chatRoutes from './routes/chat';
import authRoutes from './routes/auth';

async function bootstrap() {
  const app: Express = express();

  // Middleware
  app.use(cors({ origin: config.cors.origin }));
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`\n📍 ${req.method} ${req.path}`);
    next();
  });

  try {
    // Initialize Hedera
    console.log('\n🚀 Initializing SaucerHedge Backend...\n');
    initializeHederaClient();

    // Load all published abilities
    console.log('📦 Loading published abilities...');
    await loadAllAbilities();

    // Routes
    app.use('/api', chatRoutes);
    app.use('/api/auth', authRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date(),
        network: config.hedera.network,
      });
    });

    // Error handling
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('❌ Error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message,
      });
    });

    // Start server
    const port = config.port;
    app.listen(port, () => {
      console.log(`\n✅ SaucerHedge Backend running on port ${port}`);
      console.log(`📡 Hedera Network: ${config.hedera.network}`);
      console.log(`🔗 Base URL: http://localhost:${port}\n`);
    });
  } catch (error: any) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
