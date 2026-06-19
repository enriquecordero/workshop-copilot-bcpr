import 'reflect-metadata';
import { ReflectiveInjector, Injector } from 'injection-js';
import { AbstractLogger, Logger } from '../logger/logger';
import { notificationDependencies } from './providers/notification-provider';

export const injector: Injector = ReflectiveInjector.resolveAndCreate([
  { provide: AbstractLogger, useClass: Logger },
  ...notificationDependencies,
]);
