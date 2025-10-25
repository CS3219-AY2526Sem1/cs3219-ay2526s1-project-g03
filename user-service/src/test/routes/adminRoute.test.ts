// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-09-2025
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import express, {Express} from 'express';
import request from 'supertest';
import {HTTP_CREATED, HTTP_NOT_FOUND, HTTP_OK} from '../../constants/httpStatus';
import {
  changeUserRoleController,
  createAdminAccountController,
} from '../../controllers/adminHandler';
import adminRoutes from '../../routes/adminRoute';

jest.mock('../../controllers/adminHandler');

describe('routes/adminRoute', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/admin', adminRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /admin/users/:username/role', () => {
    it('should call changeUserRoleController with correct parameters', async () => {
      const mockController = changeUserRoleController as jest.MockedFunction<
        typeof changeUserRoleController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'Role updated successfully'});
      });

      const response = await request(app).patch('/admin/users/testuser/role').send({role: 'admin'});

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual({message: 'Role updated successfully'});
    });

    it('should handle username parameter correctly', async () => {
      const mockController = changeUserRoleController as jest.MockedFunction<
        typeof changeUserRoleController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        expect(req.params.username).toBe('johndoe');
        res.status(HTTP_OK).json({message: 'Success'});
      });

      await request(app).patch('/admin/users/johndoe/role').send({role: 'user'});

      expect(mockController).toHaveBeenCalled();
    });

    it('should route to the correct endpoint', async () => {
      const mockController = changeUserRoleController as jest.MockedFunction<
        typeof changeUserRoleController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({success: true});
      });

      const response = await request(app).patch('/admin/users/alice/role').send({role: 'admin'});

      expect(response.status).toBe(HTTP_OK);
      expect(mockController).toHaveBeenCalled();
    });
  });

  describe('POST /admin/users', () => {
    it('should call createAdminAccountController with correct parameters', async () => {
      const mockController = createAdminAccountController as jest.MockedFunction<
        typeof createAdminAccountController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_CREATED).json({message: 'Admin account created successfully'});
      });

      const response = await request(app).post('/admin/users').send({
        username: 'newadmin',
        email: 'admin@example.com',
      });

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_CREATED);
      expect(response.body).toEqual({message: 'Admin account created successfully'});
    });

    it('should handle request body correctly', async () => {
      const mockController = createAdminAccountController as jest.MockedFunction<
        typeof createAdminAccountController
      >;
      const adminData = {
        username: 'testadmin',
        email: 'test@admin.com',
      };

      mockController.mockImplementation(async (req, res, next) => {
        expect(req.body).toEqual(adminData);
        res.status(HTTP_CREATED).json({message: 'Created'});
      });

      await request(app).post('/admin/users').send(adminData);

      expect(mockController).toHaveBeenCalled();
    });

    it('should route to the correct endpoint', async () => {
      const mockController = createAdminAccountController as jest.MockedFunction<
        typeof createAdminAccountController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_CREATED).json({success: true});
      });

      const response = await request(app).post('/admin/users').send({
        username: 'admin123',
        email: 'admin123@test.com',
      });

      expect(response.status).toBe(HTTP_CREATED);
      expect(mockController).toHaveBeenCalled();
    });
  });

  describe('Route registration', () => {
    it('should have all routes registered', () => {
      const routes = adminRoutes.stack.filter(layer => layer.route).map(layer => layer.route.path);

      expect(routes).toContain('/users/:username/role');
      expect(routes).toContain('/users');
    });
  });

  describe('Invalid routes', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/admin/nonexistent');

      expect(response.status).toBe(HTTP_NOT_FOUND);
    });

    it('should return 404 for wrong HTTP method', async () => {
      const response = await request(app).get('/admin/users');

      expect(response.status).toBe(HTTP_NOT_FOUND);
    });
  });
});
