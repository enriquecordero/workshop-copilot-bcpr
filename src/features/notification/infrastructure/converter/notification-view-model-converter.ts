import { Injectable } from 'injection-js';
import { ConverterFunction } from '../../../../core/middlewares/converter/converter-function';
import { Notification } from '../../domain/entities/notification';
import { NotificationViewModel } from '../../presentation/view-models/notification-view-model';
import { InjectionToken } from 'injection-js';

export const INotificationViewModelConverterProvider =
  new InjectionToken<ConverterFunction<Notification, NotificationViewModel>>('INotificationViewModelConverterProvider');

@Injectable()
export class NotificationViewModelConverter implements ConverterFunction<Notification, NotificationViewModel> {
  apply(source: Notification): NotificationViewModel {
    const viewModel = new NotificationViewModel();
    viewModel.id = source.id;
    viewModel.userId = source.userId;
    viewModel.title = source.title;
    viewModel.message = source.message;
    viewModel.type = source.type;
    viewModel.status = source.status;
    viewModel.isRead = source.isRead();
    viewModel.createdAt = source.createdAt.toISOString();
    viewModel.readAt = source.readAt ? source.readAt.toISOString() : null;
    return viewModel;
  }
}
