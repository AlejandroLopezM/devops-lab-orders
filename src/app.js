const express = require('express');
const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Service is running',
    timestamp: new Date().toISOString()
  });
});

// GET /api/orders - lista pedidos de ejemplo
app.get('/api/orders', (req, res) => {
  const orders = [
    { id: 1, product: 'Laptop', quantity: 2, status: 'pending' },
    { id: 2, product: 'Monitor', quantity: 1, status: 'shipped' },
    { id: 3, product: 'Keyboard', quantity: 3, status: 'delivered' }
  ];
  res.status(200).json({ success: true, data: orders });
});

// GET /api/orders/:id - obtener pedido por ID
app.get('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid order ID' });
  }
  const orders = [
    { id: 1, product: 'Laptop', quantity: 2, status: 'pending' },
    { id: 2, product: 'Monitor', quantity: 1, status: 'shipped' },
    { id: 3, product: 'Keyboard', quantity: 3, status: 'delivered' }
  ];
  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.status(200).json({ success: true, data: order });
});

// POST /api/orders - crear pedido
app.post('/api/orders', (req, res) => {
  const { product, quantity } = req.body;
  if (!product || !quantity) {
    return res.status(400).json({ success: false, message: 'product and quantity are required' });
  }
  const newOrder = {
    id: Math.floor(Math.random() * 1000) + 4,
    product,
    quantity,
    status: 'pending'
  };
  res.status(201).json({ success: true, data: newOrder });
});

// Calcular total de pedidos (función pura testeable)
function calculateTotal(orders) {
  if (!Array.isArray(orders)) return 0;
  return orders.reduce((acc, o) => acc + (o.quantity || 0), 0);
}

module.exports = { app, calculateTotal };
