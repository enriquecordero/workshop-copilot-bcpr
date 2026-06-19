import { NotificationType, NotificationStatus } from '../notification-type';

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: Date;
  readAt: Date | null;
}

export class Notification {
  private data: INotification;

  constructor(partial: Partial<INotification> & Pick<INotification, 'id' | 'userId' | 'title' | 'message' | 'type'>) {
    this.data = {
      id: partial.id,
      userId: partial.userId,
      title: partial.title,
      message: partial.message,
      type: partial.type,
      status: partial.status ?? NotificationStatus.UNREAD,
      createdAt: partial.createdAt ?? new Date(),
      readAt: partial.readAt ?? null,
    };
  }

  get id(): string { return this.data.id; }
  get userId(): string { return this.data.userId; }
  get title(): string { return this.data.title; }
  get message(): string { return this.data.message; }
  get type(): NotificationType { return this.data.type; }
  get status(): NotificationStatus { return this.data.status; }
  get createdAt(): Date { return this.data.createdAt; }
  get readAt(): Date | null { return this.data.readAt; }

  markAsRead(): void {
    this.data.status = NotificationStatus.READ;
    this.data.readAt = new Date();
  }

  archive(): void {
    this.data.status = NotificationStatus.ARCHIVED;
  }

  isRead(): boolean {
    return this.data.status === NotificationStatus.READ;
  }
}

export function mapToNotification(source: Record<string, unknown>): Notification {
  return new Notification({
    id: source['id'] as string,
    userId: source['userId'] as string,
    title: source['title'] as string,
    message: source['message'] as string,
    type: source['type'] as NotificationType,
    status: source['status'] as NotificationStatus | undefined,
    createdAt: source['createdAt'] ? new Date(source['createdAt'] as string) : undefined,
    readAt: source['readAt'] ? new Date(source['readAt'] as string) : null,
  });
}
