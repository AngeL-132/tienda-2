const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');

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
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
