import express from 'express';
import path, { join } from 'path';
import cors from 'cors';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { startInventoryResetJob } from "../cron/inventoryReset.js";
import { startRecurringTasksJob } from "../cron/recurringTasks.js";


// Detect env file path based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });
console.log('Using env file:', envFile);
console.log('Loaded OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Setup __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// --- Middleware ---

// Configure CORS
const allowedOrigins = NODE_ENV === 'production'
? ['https://thermopackers.com','https://www.thermopackers.com'] // ✅ Replace with your actual frontend prod domain
// ? ['https://1st-app-thermo-packers.vercel.app'] // ✅ Replace with your actual frontend prod domain
: ['http://localhost:5173']; // Dev frontend URL

app.use(cors({
  origin: allowedOrigins,
    credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(compression()); // Enable Gzip

// Log routes for debugging (only in development)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next();
  });
}

// Serve static uploads
app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
app.use('/uploads/slips', express.static(join(process.cwd(), 'uploads/slips')));

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

  // Start daily job
startInventoryResetJob();
startRecurringTasksJob();

// --- Routes ---
import adminRoutes from '../routes/adminRoutes.js';
import chatRoute from '../routes/chat.js';
import assetRoutes from '../routes/assetRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import orderRoutes from '../routes/orderRoutes.js';
import productRoutes from '../routes/productRoutes.js';
import fileRoutes from '../routes/fileRoutes.js';
import todosRouter from '../routes/todoRoutes.js';
import customerRoutes from '../routes/customerRoutes.js';
import productionReportsRoutes from '../routes/productionReportsRoutes.js';
import blockMouldingRoutes from '../routes/blockMouldingRoutes.js';
import productsMulterRoutes from '../routes/productsMulterRoutes.js';
import { createDanaSlip, createDispatchSlip, createPackagingSlip, createProductionSlip } from '../routes/slipRoutes.js';

app.use('/api/chat', chatRoute);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/todos', todosRouter);
app.post('/api/slips/production', createProductionSlip);
app.post('/api/slips/dispatch', createDispatchSlip);
app.post('/api/slips/packaging', createPackagingSlip);
app.post('/api/slips/dana', createDanaSlip);
app.use("/api/products-multer", productsMulterRoutes);
app.use("/api/customers", customerRoutes);
app.use('/api/production-reports', productionReportsRoutes);
app.use('/api/production-reports-block', blockMouldingRoutes);



// Add this:
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// --- Fallback for Unknown Routes ---
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${NODE_ENV} mode)`);
});
