import { Injectable, Inject } from 'injection-js';
import { Router, Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { AbstractLogger } from '../../../../core/logger/logger';
import { ListNotificationsUseCase } from '../../application/usecases/list-notifications-use-case';
import { CreateNotificationUseCase } from '../../application/usecases/create-notification-use-case';
import { MarkAsReadUseCase } from '../../application/usecases/mark-as-read-use-case';
import { CreateNotificationArguments } from '../../presentation/arguments/create-notification-arguments';
import { UnprocessableEntityError } from '../../../../core/error/unprocessable-entity-error';

@Injectable()
export class NotificationController {
  constructor(
    private readonly logger: AbstractLogger,
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
  ) {}

  registerRoutes(router: Router): void {
    router.get('/api/notifications/:userId', (req, res, next) => this.listNotifications(req, res, next));
    router.post('/api/notifications', (req, res, next) => this.createNotification(req, res, next));
    router.patch('/api/notifications/:id/read', (req, res, next) => this.markAsRead(req, res, next));
  }

  private async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const result = await this.listNotificationsUseCase.execute(userId as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  private async createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const args = plainToInstance(CreateNotificationArguments, req.body);
      try {
        await validateOrReject(args);
      } catch (validationErrors) {
        throw new UnprocessableEntityError(
          'Validation failed',
          Array.isArray(validationErrors)
            ? validationErrors.map((e: { toString(): string }) => e.toString()).join('; ')
            : 'Invalid input data',
        );
      }

      const result = await this.createNotificationUseCase.execute(args);
      res.status(201).json({
        success: true,
        data: {
          id: result.id, userId: result.userId, title: result.title,
          message: result.message, type: result.type, status: result.status,
          createdAt: result.createdAt.toISOString(), readAt: result.readAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await this.markAsReadUseCase.execute(id);
      res.status(200).json({
        success: true,
        data: {
          id: result.id, userId: result.userId, title: result.title,
          message: result.message, type: result.type, status: result.status,
          createdAt: result.createdAt.toISOString(),
          readAt: result.readAt ? result.readAt.toISOString() : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
