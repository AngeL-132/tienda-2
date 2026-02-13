const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Token inválido' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

router.post('/add', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, cantidad } = req.body;
    console.log('CART ADD called by user', userId, 'product_id=', product_id, 'cantidad=', cantidad);
    if (!product_id || !cantidad) return res.status(400).json({ error: 'Faltan datos' });

    const [prod] = await pool.query('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!prod.length) return res.status(404).json({ error: 'Producto no encontrado' });

    const [exists] = await pool.query('SELECT id, cantidad FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, product_id]);
    if (exists.length) {
      const newQty = exists[0].cantidad + Number(cantidad);
      await pool.query('UPDATE cart_items SET cantidad = ? WHERE id = ?', [newQty, exists[0].id]);
      return res.json({ ok: true });
    }

    await pool.query('INSERT INTO cart_items (user_id, product_id, cantidad) VALUES (?, ?, ?)', [userId, product_id, cantidad]);
    console.log('Inserted cart item for user', userId, 'product', product_id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error in /api/cart/add', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(`SELECT ci.id, ci.cantidad, p.id as product_id, p.nombre, p.codigo, p.precio, p.descripcion
      FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ?`, [userId]);

    const total = rows.reduce((s, r) => s + r.precio * r.cantidad, 0);
    res.json({ items: rows, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/empty', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(`SELECT ci.id as cart_id, ci.cantidad, p.id as product_id, p.precio
      FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ?`, [userId]);
    if (!rows.length) return res.status(400).json({ error: 'Carrito vacío' });
    const total = rows.reduce((s, r) => s + parseFloat(r.precio) * r.cantidad, 0).toFixed(2);
    const [orderResult] = await pool.query('INSERT INTO orders (user_id, total) VALUES (?, ?)', [userId, total]);
    const orderId = orderResult.insertId;
    for (const r of rows) {
      await pool.query('INSERT INTO order_items (order_id, product_id, cantidad, precio) VALUES (?, ?, ?, ?)', [orderId, r.product_id, r.cantidad, r.precio]);
    }
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    res.json({ ok: true, orderId, total });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

module.exports = router;
