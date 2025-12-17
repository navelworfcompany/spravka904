import { ApplicationService } from '../../services/applicationService.js';
import { Application } from '../../models/Application.js';
import { User } from '../../models/User.js';
import { AppError } from '../../middleware/errorHandler.js';

// Mock моделей
jest.mock('../../models/Application.js');
jest.mock('../../models/User.js');

describe('ApplicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createApplication', () => {
    it('should create application successfully', async () => {
      const applicationData = {
        name: 'Иван Иванов',
        phone: '+79991234567',
        product_type: 'Мебель',
        product: 'Стул',
        material: 'Дерево',
        size: 'Большой',
        comment: 'Нужно срочно'
      };

      const mockApplication = {
        id: 1,
        ...applicationData,
        toJSON: jest.fn().mockReturnValue({ id: 1, ...applicationData })
      };

      Application.create.mockResolvedValue(mockApplication);

      const result = await ApplicationService.createApplication(applicationData);

      expect(Application.create).toHaveBeenCalledWith(applicationData);
      expect(result).toEqual({
        application: { id: 1, ...applicationData },
        message: 'Заявка успешно создана'
      });
    });

    it('should create application with user_id', async () => {
      const applicationData = {
        name: 'Иван Иванов',
        phone: '+79991234567',
        product_type: 'Мебель',
        product: 'Стул'
      };

      const userId = 1;
      const mockUser = { id: userId };
      const mockApplication = {
        id: 1,
        ...applicationData,
        user_id: userId,
        toJSON: jest.fn().mockReturnValue({ id: 1, ...applicationData, user_id: userId })
      };

      User.findById.mockResolvedValue(mockUser);
      Application.create.mockResolvedValue(mockApplication);

      const result = await ApplicationService.createApplication(applicationData, userId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(Application.create).toHaveBeenCalledWith({
        ...applicationData,
        user_id: userId
      });
      expect(result.application.user_id).toBe(userId);
    });

    it('should throw error if user not found', async () => {
      const applicationData = {
        name: 'Иван Иванов',
        phone: '+79991234567',
        product_type: 'Мебель',
        product: 'Стул'
      };

      const userId = 999;
      User.findById.mockResolvedValue(null);

      await expect(ApplicationService.createApplication(applicationData, userId))
        .rejects
        .toThrow(AppError);

      expect(User.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('getApplications', () => {
    it('should return applications with pagination', async () => {
      const mockApplications = [
        { id: 1, name: 'Заявка 1', toJSON: jest.fn().mockReturnValue({ id: 1, name: 'Заявка 1' }) },
        { id: 2, name: 'Заявка 2', toJSON: jest.fn().mockReturnValue({ id: 2, name: 'Заявка 2' }) }
      ];

      Application.findAll.mockResolvedValue({
        applications: mockApplications,
        total: 2,
        page: 1,
        limit: 10,
        pages: 1
      });

      const filters = { page: 1, limit: 10 };
      const result = await ApplicationService.getApplications(filters);

      expect(Application.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: null,
        phone: null,
        markedForDeletion: false
      });
      expect(result.applications).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by status', async () => {
      const filters = { status: 'new' };
      
      Application.findAll.mockResolvedValue({
        applications: [],
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
      });

      await ApplicationService.getApplications(filters);

      expect(Application.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: 'new',
        phone: null,
        markedForDeletion: false
      });
    });

    it('should filter by user phone for non-admin users', async () => {
      const user = { role: 'user', phone: '+79991234567' };
      const filters = {};

      Application.findAll.mockResolvedValue({
        applications: [],
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
      });

      await ApplicationService.getApplications(filters, user);

      expect(Application.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: null,
        phone: '+79991234567',
        markedForDeletion: false
      });
    });
  });

  describe('getApplicationById', () => {
    it('should return application by id', async () => {
      const mockApplication = {
        id: 1,
        name: 'Тестовая заявка',
        phone: '+79991234567',
        toJSON: jest.fn().mockReturnValue({ id: 1, name: 'Тестовая заявка', phone: '+79991234567' })
      };

      Application.findById.mockResolvedValue(mockApplication);

      const result = await ApplicationService.getApplicationById(1);

      expect(Application.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Тестовая заявка');
    });

    it('should throw error if application not found', async () => {
      Application.findById.mockResolvedValue(null);

      await expect(ApplicationService.getApplicationById(999))
        .rejects
        .toThrow(AppError);
    });

    it('should check user permissions', async () => {
      const mockApplication = {
        id: 1,
        phone: '+79991234567',
        toJSON: jest.fn().mockReturnValue({ id: 1, phone: '+79991234567' })
      };

      const user = { role: 'user', phone: '+79998887766' }; // Different phone

      Application.findById.mockResolvedValue(mockApplication);

      await expect(ApplicationService.getApplicationById(1, user))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('addWorkerResponse', () => {
    it('should add worker response successfully', async () => {
      const mockApplication = {
        id: 1,
        isMarkedForDeletion: jest.fn().mockReturnValue(false),
        addWorkerResponse: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({ id: 1, responses: [] })
      };

      Application.findById.mockResolvedValue(mockApplication);

      const workerId = 2;
      const response = 'Мы можем выполнить ваш заказ в течение 3 дней';

      const result = await ApplicationService.addWorkerResponse(1, workerId, response);

      expect(Application.findById).toHaveBeenCalledWith(1);
      expect(mockApplication.addWorkerResponse).toHaveBeenCalledWith(workerId, response);
      expect(result.message).toBe('Ответ успешно добавлен');
    });

    it('should throw error if application marked for deletion', async () => {
      const mockApplication = {
        id: 1,
        isMarkedForDeletion: jest.fn().mockReturnValue(true)
      };

      Application.findById.mockResolvedValue(mockApplication);

      await expect(ApplicationService.addWorkerResponse(1, 2, 'Ответ'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('markForDeletion', () => {
    it('should mark application for deletion', async () => {
      const mockApplication = {
        id: 1,
        isMarkedForDeletion: jest.fn().mockReturnValue(false),
        markForDeletion: jest.fn().mockResolvedValue()
      };

      Application.findById.mockResolvedValue(mockApplication);

      const result = await ApplicationService.markForDeletion(1);

      expect(mockApplication.markForDeletion).toHaveBeenCalled();
      expect(result.message).toBe('Заявка помечена на удаление');
    });

    it('should throw error if already marked for deletion', async () => {
      const mockApplication = {
        id: 1,
        isMarkedForDeletion: jest.fn().mockReturnValue(true)
      };

      Application.findById.mockResolvedValue(mockApplication);

      await expect(ApplicationService.markForDeletion(1))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('getApplicationStats', () => {
    it('should return application statistics', async () => {
      const mockStats = {
        total: 10,
        recent: 5,
        byStatus: { new: 3, in_progress: 2, completed: 5 }
      };

      Application.getStats = jest.fn().mockResolvedValue(mockStats);

      const result = await ApplicationService.getApplicationStats();

      expect(Application.getStats).toHaveBeenCalled();
      expect(result.total).toBe(10);
      expect(result.recent).toBe(5);
    });
  });
});