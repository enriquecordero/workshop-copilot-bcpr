import 'reflect-metadata';
import express from 'express';
import { injector } from '../injection/injector';
import { loggerMiddleware } from '../middlewares/logger-middleware';
import { errorInterceptor } from '../middlewares/interceptor/error-interceptor';
import { NotificationController } from '../../features/notification/infrastructure/controller/notification-controller';

export function createApp(): express.Application {
  const app = express();

  app.use(express.json());
  app.use(loggerMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const router = express.Router();
  const notificationController = injector.get(NotificationController) as NotificationController;
  notificationController.registerRoutes(router);
  app.use(router);

  app.use(errorInterceptor);

  return app;
}
