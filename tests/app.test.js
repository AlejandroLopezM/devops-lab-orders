const request = require('supertest');
const { app, calculateTotal } = require('../src/app');

describe('Health Check', () => {
  test('GET /health debe retornar status 200 y ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.message).toBe('Service is running');
  });
});

describe('GET /api/orders', () => {
  test('debe retornar lista de pedidos con success true', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('cada pedido debe tener id, product, quantity y status', async () => {
    const res = await request(app).get('/api/orders');
    const order = res.body.data[0];
    expect(order).toHaveProperty('id');
    expect(order).toHaveProperty('product');
    expect(order).toHaveProperty('quantity');
    expect(order).toHaveProperty('status');
  });
});

describe('GET /api/orders/:id', () => {
  test('debe retornar pedido existente por ID', async () => {
    const res = await request(app).get('/api/orders/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(1);
  });

  test('debe retornar 404 para pedido inexistente', async () => {
    const res = await request(app).get('/api/orders/999');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('debe retornar 400 para ID inválido', async () => {
    const res = await request(app).get('/api/orders/abc');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/orders', () => {
  test('debe crear un nuevo pedido con datos válidos', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ product: 'Mouse', quantity: 2 });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product).toBe('Mouse');
    expect(res.body.data.status).toBe('pending');
  });

  test('debe retornar 400 si faltan campos requeridos', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ product: 'Mouse' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('debe retornar 400 si el body está vacío', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({});
    expect(res.statusCode).toBe(400);
  });
});

describe('calculateTotal', () => {
  test('debe sumar correctamente las cantidades', () => {
    const orders = [
      { quantity: 2 },
      { quantity: 3 },
      { quantity: 5 }
    ];
    expect(calculateTotal(orders)).toBe(10);
  });

  test('debe retornar 0 para array vacío', () => {
    expect(calculateTotal([])).toBe(0);
  });

  test('debe retornar 0 si no recibe array', () => {
    expect(calculateTotal(null)).toBe(0);
    expect(calculateTotal(undefined)).toBe(0);
  });
});
