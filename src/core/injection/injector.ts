import 'reflect-metadata';
import { ReflectiveInjector, Injector } from 'injection-js';
import { AbstractLogger, Logger } from '../logger/logger';

// Los participantes agregaran sus feature providers aqui durante el Ejercicio 2
// Ejemplo: import { notificationDependencies } from './providers/notification-provider';

export const injector: Injector = ReflectiveInjector.resolveAndCreate([
  { provide: AbstractLogger, useClass: Logger },
  // ...notificationDependencies,
]);
