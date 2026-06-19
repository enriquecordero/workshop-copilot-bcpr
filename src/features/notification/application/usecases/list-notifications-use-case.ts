import { Injectable, Inject } from 'injection-js';
import { AbstractLogger } from '../../../../core/logger/logger';
import { ReadNotificationsPort, IReadNotificationsPortProvider } from '../ports/read-notifications-port';
import { ConverterFunction } from '../../../../core/middlewares/converter/converter-function';
import { Notification } from '../../domain/entities/notification';
import { NotificationViewModel } from '../../presentation/view-models/notification-view-model';
import { INotificationViewModelConverterProvider } from '../../infrastructure/converter/notification-view-model-converter';

@Injectable()
export class ListNotificationsUseCase {
  constructor(
    private readonly logger: AbstractLogger,
    @Inject(IReadNotificationsPortProvider) private readonly readPort: ReadNotificationsPort,
    @Inject(INotificationViewModelConverterProvider) private readonly converter: ConverterFunction<Notification, NotificationViewModel>,
  ) {}

  async execute(userId: string): Promise<NotificationViewModel[]> {
    this.logger.info('Event started: Listing notifications', { userId });

    const notifications = await this.readPort.findByUserId(userId);
    const viewModels = notifications.map((n) => this.converter.apply(n));

    this.logger.info('Event finished: Notifications listed', { userId, count: viewModels.length });
    return viewModels;
  }
}
