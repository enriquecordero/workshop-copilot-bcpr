import { InjectionToken } from 'injection-js';
import { Notification } from '../../domain/entities/notification';

export interface ReadNotificationsPort {
  findByUserId(userId: string): Promise<Notification[]>;
  findById(id: string): Promise<Notification | null>;
}

export const IReadNotificationsPortProvider =
  new InjectionToken<ReadNotificationsPort>('IReadNotificationsPortProvider');
