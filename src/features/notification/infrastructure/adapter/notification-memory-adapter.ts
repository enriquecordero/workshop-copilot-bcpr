import { Injectable } from 'injection-js';
import { ReadNotificationsPort } from '../../application/ports/read-notifications-port';
import { WriteNotificationPort } from '../../application/ports/write-notification-port';
import { Notification } from '../../domain/entities/notification';
import { NotificationType, NotificationStatus } from '../../domain/notification-type';

@Injectable()
export class NotificationMemoryAdapter implements ReadNotificationsPort, WriteNotificationPort {
  private store = new Map<string, Notification>();

  constructor() {
    this.seedData();
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return Array.from(this.store.values()).filter((n) => n.userId === userId);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.store.get(id) ?? null;
  }

  async save(notification: Notification): Promise<Notification> {
    this.store.set(notification.id, notification);
    return notification;
  }

  async update(notification: Notification): Promise<Notification> {
    this.store.set(notification.id, notification);
    return notification;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  private seedData(): void {
    const seed: Array<{ id: string; userId: string; title: string; message: string; type: NotificationType; status: NotificationStatus; readAt: Date | null }> = [
      {
        id: 'notif-001',
        userId: 'user-001',
        title: 'Tu transferencia ACH fue procesada',
        message: 'La transferencia de $500.00 a la cuenta *4521 fue completada exitosamente.',
        type: NotificationType.PUSH,
        status: NotificationStatus.READ,
        readAt: new Date('2025-06-15T10:30:00Z'),
      },
      {
        id: 'notif-002',
        userId: 'user-001',
        title: 'Nuevo estado de cuenta disponible',
        message: 'Tu estado de cuenta del mes de junio ya esta disponible para descarga.',
        type: NotificationType.EMAIL,
        status: NotificationStatus.UNREAD,
        readAt: null,
      },
      {
        id: 'notif-003',
        userId: 'user-001',
        title: 'Codigo de verificacion: 4521',
        message: 'Tu codigo de verificacion es 4521. Expira en 10 minutos.',
        type: NotificationType.SMS,
        status: NotificationStatus.READ,
        readAt: new Date('2025-06-18T14:00:00Z'),
      },
      {
        id: 'notif-004',
        userId: 'user-002',
        title: 'Mantenimiento programado para este sabado',
        message: 'Los servicios estaran en mantenimiento el sabado 21 de junio de 2:00 AM a 6:00 AM.',
        type: NotificationType.PUSH,
        status: NotificationStatus.UNREAD,
        readAt: null,
      },
      {
        id: 'notif-005',
        userId: 'user-001',
        title: 'Tu pago de $150.00 fue confirmado',
        message: 'El pago a LUMA Energy por $150.00 fue procesado exitosamente.',
        type: NotificationType.PUSH,
        status: NotificationStatus.UNREAD,
        readAt: null,
      },
    ];

    for (const item of seed) {
      const notification = new Notification({
        id: item.id,
        userId: item.userId,
        title: item.title,
        message: item.message,
        type: item.type,
        status: item.status,
        createdAt: new Date('2025-06-18T08:00:00Z'),
        readAt: item.readAt,
      });
      this.store.set(notification.id, notification);
    }
  }
}
