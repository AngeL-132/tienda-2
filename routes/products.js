const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();
const fs = require('fs');
const path = require('path');

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

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:codigo', async (req, res) => {
  try {
    const codigo = req.params.codigo;
    const [rows] = await pool.query('SELECT * FROM products WHERE codigo = ?', [codigo]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.nivel !== 'admin') return res.status(403).json({ error: 'Solo admins' });
    const { nombre, codigo, precio, descripcion } = req.body;
    if (!nombre || !codigo || !precio) return res.status(400).json({ error: 'Faltan datos' });
    const [exists] = await pool.query('SELECT id FROM products WHERE codigo = ?', [codigo]);
    if (exists.length) return res.status(400).json({ error: 'Código ya existe' });
    const [result] = await pool.query('INSERT INTO products (nombre, codigo, precio, descripcion) VALUES (?, ?, ?, ?)', [nombre, codigo, precio, descripcion || '']);
    res.json({ id: result.insertId, nombre, codigo, precio, descripcion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.nivel !== 'admin') return res.status(403).json({ error: 'Solo admins' });
    const id = req.params.id;
    console.log(`DELETE /api/products/${id} requested by user:`, req.user);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    try {
      const logEntry = `[${new Date().toISOString()}] DELETE /api/products/${id} by user=${JSON.stringify(req.user)} headers=${JSON.stringify(req.headers)} body=${JSON.stringify(req.body)}`;
      fs.appendFileSync(path.join(__dirname, '..', 'server-debug.log'), logEntry + '\n');
    } catch (e) {
      console.error('Failed to append delete log:', e);
    }
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    console.log('DB delete result:', result);
    if (result.affectedRows === 0) {
      console.log(`Product id=${id} not found`);
      return res.status(404).json({ error: 'No encontrado' });
    }
    console.log(`Product id=${id} deleted successfully`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

module.exports = router;
