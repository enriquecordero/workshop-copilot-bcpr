import 'reflect-metadata';
import { ListNotificationsUseCase } from '../../application/usecases/list-notifications-use-case';
import { Notification } from '../../domain/entities/notification';
import { NotificationType, NotificationStatus } from '../../domain/notification-type';

describe('ListNotificationsUseCase', () => {
  const mockReadPort = {
    findByUserId: jest.fn(),
    findById: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockConverter = {
    apply: jest.fn(),
  };

  let useCase: ListNotificationsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ListNotificationsUseCase(
      mockLogger as any,
      mockReadPort as any,
      mockConverter as any,
    );
  });

  describe('execute', () => {
    it('debe retornar notificaciones convertidas a ViewModel', async () => {
      // Arrange
      const notifications = [
        new Notification({
          id: '1', userId: 'user-001', title: 'Test 1',
          message: 'Message 1', type: NotificationType.PUSH,
        }),
        new Notification({
          id: '2', userId: 'user-001', title: 'Test 2',
          message: 'Message 2', type: NotificationType.EMAIL,
        }),
      ];
      mockReadPort.findByUserId.mockResolvedValue(notifications);
      mockConverter.apply.mockImplementation((n: Notification) => ({
        id: n.id, title: n.title, isRead: n.isRead(),
      }));

      // Act
      const result = await useCase.execute('user-001');

      // Assert
      expect(mockReadPort.findByUserId).toHaveBeenCalledWith('user-001');
      expect(mockConverter.apply).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it('debe retornar array vacio si el usuario no tiene notificaciones', async () => {
      // Arrange
      mockReadPort.findByUserId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute('user-999');

      // Assert
      expect(result).toEqual([]);
      expect(mockConverter.apply).not.toHaveBeenCalled();
    });

    it('debe propagar errores del port', async () => {
      // Arrange
      mockReadPort.findByUserId.mockRejectedValue(new Error('DB connection failed'));

      // Act & Assert
      await expect(useCase.execute('user-001')).rejects.toThrow('DB connection failed');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
    });
  });
});
