import { Injectable, Inject } from 'injection-js';
import { AbstractLogger } from '../../../../core/logger/logger';
import { ReadNotificationsPort, IReadNotificationsPortProvider } from '../ports/read-notifications-port';
import { WriteNotificationPort, IWriteNotificationPortProvider } from '../ports/write-notification-port';
import { NotFoundError } from '../../../../core/error/not-found-error';
import { Notification } from '../../domain/entities/notification';

@Injectable()
export class MarkAsReadUseCase {
  constructor(
    private readonly logger: AbstractLogger,
    @Inject(IReadNotificationsPortProvider) private readonly readPort: ReadNotificationsPort,
    @Inject(IWriteNotificationPortProvider) private readonly writePort: WriteNotificationPort,
  ) {}

  async execute(notificationId: string): Promise<Notification> {
    this.logger.info('Event started: Marking notification as read', { notificationId });

    const notification = await this.readPort.findById(notificationId);

    if (!notification) {
      throw new NotFoundError(
        `Notification ${notificationId} not found`,
        'The requested notification does not exist',
      );
    }

    notification.markAsRead();
    const updated = await this.writePort.update(notification);

    this.logger.info('Event finished: Notification marked as read', { notificationId, readAt: updated.readAt });
    return updated;
  }
}
