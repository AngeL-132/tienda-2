const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger for debugging
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
	console.log('Headers:', req.headers);
	if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
		try {
			console.log('Body:', req.body);
		} catch (e) {
			console.log('Body: <unavailable>');
		}
	}
	try {
		const logLine = `[${new Date().toISOString()}] ${req.method} ${req.url} | headers=${JSON.stringify(req.headers)} | body=${JSON.stringify(req.body || {})}`;
		const stream = fs.createWriteStream(path.join(__dirname, 'server-debug.log'), { flags: 'a' });
		stream.write(logLine + '\n');
		stream.end();
	} catch (e) {
		console.error('Failed to write debug log file:', e);
	}
	next();
});

// Migration endpoint - call once to create tables
app.get('/api/migrate', async (req, res) => {
	try {
		await pool.query(`
			CREATE TABLE IF NOT EXISTS users (
				id SERIAL PRIMARY KEY,
				nombre VARCHAR(255) NOT NULL,
				email VARCHAR(255) UNIQUE NOT NULL,
				password VARCHAR(255) NOT NULL,
				nivel VARCHAR(50) DEFAULT 'usuario',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE IF NOT EXISTS products (
				id SERIAL PRIMARY KEY,
				nombre VARCHAR(255) NOT NULL,
				codigo VARCHAR(100) UNIQUE NOT NULL,
				precio DECIMAL(10, 2) NOT NULL,
				descripcion TEXT DEFAULT '',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE IF NOT EXISTS cart_items (
				id SERIAL PRIMARY KEY,
				user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
				cantidad INTEGER NOT NULL DEFAULT 1,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(user_id, product_id)
			);

			CREATE TABLE IF NOT EXISTS orders (
				id SERIAL PRIMARY KEY,
				user_id INTEGER NOT NULL REFERENCES users(id),
				total DECIMAL(10, 2) NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE IF NOT EXISTS order_items (
				id SERIAL PRIMARY KEY,
				order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
				product_id INTEGER NOT NULL REFERENCES products(id),
				cantidad INTEGER NOT NULL,
				precio DECIMAL(10, 2) NOT NULL
			);
		`);
		res.json({ ok: true, message: 'Tablas creadas correctamente' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
