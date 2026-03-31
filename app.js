require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./src/middleware/errorHandler');
const authRoutes = require('./src/modules/auth/auth.routes');
const categoryRoutes = require('./src/modules/categories/categories.routes');
const productRoutes = require('./src/modules/products/products.routes');
const cartRoutes = require('./src/modules/cart/cart.routes');
const favoriteRoutes = require('./src/modules/favorites/favorites.routes');
const orderRoutes = require('./src/modules/orders/orders.routes');
const paymentRoutes = require('./src/modules/payment/payment.routes');
const reviewRoutes = require('./src/modules/reviews/reviews.routes');
const questionRoutes = require('./src/modules/questions/questions.routes');
const addressRoutes = require('./src/modules/addresses/addresses.routes');
const couponRoutes = require('./src/modules/coupons/coupons.routes');
const dashboardRoutes = require('./src/modules/dashboard/dashboard.routes');
const refundRoutes = require('./src/modules/refunds/refunds.routes');
const storyRoutes = require('./src/modules/stories/stories.routes');

const app = express();

// Güvenlik
app.use(helmet());
app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(u => u.trim()),
  credentials: true,
}));

// Rate limiting — genel limit
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Çok fazla istek gönderildi, lütfen bekleyin.' },
}));

// Sıkı limit: misafir sipariş takibi (brute force'a karşı)
app.use('/api/orders/guest/track', rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Çok fazla deneme yapıldı, lütfen bekleyin.' },
}));

// Sıkı limit: ödeme başlatma
app.use('/api/payment/initiate', rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Çok fazla ödeme denemesi, lütfen bekleyin.' },
}));

// Sıkı limit: auth endpoint'leri
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Çok fazla istek gönderildi, lütfen bekleyin.' },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/stories', storyRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint bulunamadı' }));

// Error handler
app.use(errorHandler);

module.exports = app;
