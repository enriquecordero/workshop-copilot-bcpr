export class NotificationViewModel {
  id!: string;
  userId!: string;
  title!: string;
  message!: string;
  type!: string;
  status!: string;
  isRead!: boolean;
  createdAt!: string;
  readAt!: string | null;
}
