import { Notification } from '../../domain/entities/notification';
import { NotificationType, NotificationStatus } from '../../domain/notification-type';

describe('Notification Entity', () => {
  it('debe crear una notificacion con defaults correctos', () => {
    const notification = new Notification({
      id: '1',
      userId: 'user-001',
      title: 'Test',
      message: 'Test message',
      type: NotificationType.PUSH,
    });

    expect(notification.id).toBe('1');
    expect(notification.status).toBe(NotificationStatus.UNREAD);
    expect(notification.readAt).toBeNull();
    expect(notification.isRead()).toBe(false);
    expect(notification.createdAt).toBeInstanceOf(Date);
  });

  it('debe marcar como leida correctamente', () => {
    const notification = new Notification({
      id: '1', userId: 'user-001', title: 'Test',
      message: 'Msg', type: NotificationType.EMAIL,
    });

    notification.markAsRead();

    expect(notification.status).toBe(NotificationStatus.READ);
    expect(notification.readAt).toBeInstanceOf(Date);
    expect(notification.isRead()).toBe(true);
  });

  it('debe archivar correctamente', () => {
    const notification = new Notification({
      id: '1', userId: 'user-001', title: 'Test',
      message: 'Msg', type: NotificationType.SMS,
    });

    notification.archive();

    expect(notification.status).toBe(NotificationStatus.ARCHIVED);
    expect(notification.isRead()).toBe(false);
  });

  it('debe respetar status pasado en constructor', () => {
    const notification = new Notification({
      id: '1', userId: 'user-001', title: 'Test',
      message: 'Msg', type: NotificationType.PUSH,
      status: NotificationStatus.READ,
      readAt: new Date('2025-01-01'),
    });

    expect(notification.isRead()).toBe(true);
    expect(notification.readAt).toEqual(new Date('2025-01-01'));
  });
});
