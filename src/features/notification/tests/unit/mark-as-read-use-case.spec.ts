import 'reflect-metadata';
import { MarkAsReadUseCase } from '../../application/usecases/mark-as-read-use-case';
import { Notification } from '../../domain/entities/notification';
import { NotificationType, NotificationStatus } from '../../domain/notification-type';
import { NotFoundError } from '../../../../core/error/not-found-error';

describe('MarkAsReadUseCase', () => {
  const mockReadPort = {
    findByUserId: jest.fn(),
    findById: jest.fn(),
  };

  const mockWritePort = {
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  let useCase: MarkAsReadUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new MarkAsReadUseCase(mockLogger as any, mockReadPort as any, mockWritePort as any);
  });

  it('debe marcar una notificacion como leida', async () => {
    // Arrange
    const notification = new Notification({
      id: 'notif-001', userId: 'user-001', title: 'Test',
      message: 'Message', type: NotificationType.PUSH,
      status: NotificationStatus.UNREAD,
    });
    mockReadPort.findById.mockResolvedValue(notification);
    mockWritePort.update.mockResolvedValue(notification);

    // Act
    const result = await useCase.execute('notif-001');

    // Assert
    expect(result.isRead()).toBe(true);
    expect(result.readAt).not.toBeNull();
    expect(mockWritePort.update).toHaveBeenCalledWith(notification);
    expect(mockLogger.info).toHaveBeenCalledTimes(2);
  });

  it('debe lanzar NotFoundError si la notificacion no existe', async () => {
    // Arrange
    mockReadPort.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute('notif-999')).rejects.toThrow(NotFoundError);
    expect(mockWritePort.update).not.toHaveBeenCalled();
  });
});
