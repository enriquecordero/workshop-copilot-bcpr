import { Injectable, Inject } from 'injection-js';
import { v4 as uuidv4 } from 'uuid';
import { AbstractLogger } from '../../../../core/logger/logger';
import { WriteNotificationPort, IWriteNotificationPortProvider } from '../ports/write-notification-port';
import { Notification } from '../../domain/entities/notification';
import { CreateNotificationArguments } from '../../presentation/arguments/create-notification-arguments';

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly logger: AbstractLogger,
    @Inject(IWriteNotificationPortProvider) private readonly writePort: WriteNotificationPort,
  ) {}

  async execute(args: CreateNotificationArguments): Promise<Notification> {
    this.logger.info('Event started: Creating notification', { userId: args.userId, type: args.type });

    const notification = new Notification({
      id: uuidv4(),
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: args.type,
    });

    const saved = await this.writePort.save(notification);

    this.logger.info('Event finished: Notification created', { id: saved.id, userId: saved.userId });
    return saved;
  }
}
