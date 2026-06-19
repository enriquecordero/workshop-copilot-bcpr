import 'reflect-metadata';
import express from 'express';
import { loggerMiddleware } from '../middlewares/logger-middleware';
import { errorInterceptor } from '../middlewares/interceptor/error-interceptor';

// Los participantes importaran y registraran su controller aqui durante el Ejercicio 2
// Ejemplo:
// import { injector } from '../injection/injector';
// import { NotificationController } from '../../features/notification/infrastructure/controller/notification-controller';

export function createApp(): express.Application {
  const app = express();

  app.use(express.json());
  app.use(loggerMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Los participantes agregaran sus rutas aqui:
  // const router = express.Router();
  // const controller = injector.get(NotificationController) as NotificationController;
  // controller.registerRoutes(router);
  // app.use(router);

  app.use(errorInterceptor);

  return app;
}
