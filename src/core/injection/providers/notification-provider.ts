import { Provider } from 'injection-js';
import { ListNotificationsUseCase } from '../../../features/notification/application/usecases/list-notifications-use-case';
import { CreateNotificationUseCase } from '../../../features/notification/application/usecases/create-notification-use-case';
import { MarkAsReadUseCase } from '../../../features/notification/application/usecases/mark-as-read-use-case';
import { IReadNotificationsPortProvider } from '../../../features/notification/application/ports/read-notifications-port';
import { IWriteNotificationPortProvider } from '../../../features/notification/application/ports/write-notification-port';
import { NotificationMemoryAdapter } from '../../../features/notification/infrastructure/adapter/notification-memory-adapter';
import { INotificationViewModelConverterProvider, NotificationViewModelConverter } from '../../../features/notification/infrastructure/converter/notification-view-model-converter';
import { NotificationController } from '../../../features/notification/infrastructure/controller/notification-controller';

export const notificationDependencies: Provider[] = [
  ListNotificationsUseCase,
  CreateNotificationUseCase,
  MarkAsReadUseCase,
  NotificationMemoryAdapter,
  NotificationViewModelConverter,
  NotificationController,
  { provide: IReadNotificationsPortProvider, useClass: NotificationMemoryAdapter },
  { provide: IWriteNotificationPortProvider, useClass: NotificationMemoryAdapter },
  { provide: INotificationViewModelConverterProvider, useClass: NotificationViewModelConverter },
];
