import 'reflect-metadata';
import request from 'supertest';
import { createApp } from '../../../../core/server/app';

const app = createApp();

describe('NotificationController (integration)', () => {
  describe('GET /health', () => {
    it('debe retornar status ok', async () => {
      const response = await request(app).get('/health').expect(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/notifications/:userId', () => {
    it('debe retornar notificaciones del usuario user-001', async () => {
      const response = await request(app)
        .get('/api/notifications/user-001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('isRead');
    });

    it('debe retornar array vacio para usuario sin notificaciones', async () => {
      const response = await request(app)
        .get('/api/notifications/user-999')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /api/notifications', () => {
    it('debe crear una notificacion con datos validos', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send({
          userId: 'user-001',
          title: 'Notificacion de prueba',
          message: 'Este es un test del workshop',
          type: 'PUSH',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Notificacion de prueba');
    });

    it('debe retornar 422 con datos invalidos', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send({ userId: '' })
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    it('debe retornar 422 con tipo invalido', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send({
          userId: 'user-001',
          title: 'Test',
          message: 'Test',
          type: 'INVALID_TYPE',
        })
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('debe marcar una notificacion como leida', async () => {
      const response = await request(app)
        .patch('/api/notifications/notif-002/read')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('debe retornar 404 para notificacion inexistente', async () => {
      const response = await request(app)
        .patch('/api/notifications/notif-999/read')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
