import { InjectionToken } from 'injection-js';
import { Notification } from '../../domain/entities/notification';

export interface WriteNotificationPort {
  save(notification: Notification): Promise<Notification>;
  update(notification: Notification): Promise<Notification>;
  delete(id: string): Promise<void>;
}

export const IWriteNotificationPortProvider =
  new InjectionToken<WriteNotificationPort>('IWriteNotificationPortProvider');
