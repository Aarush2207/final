const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Routes ──────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const managerRoutes   = require('./routes/manager');
const employeeRoutes  = require('./routes/employee');
const roleRoutes      = require('./routes/roles');
const interviewRoutes = require('./routes/interview');
const resumeRoutes    = require('./routes/resume');

app.use('/api/auth',      authRoutes);
app.use('/api/manager',   managerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/roles',     roleRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/resume',    resumeRoutes);

// ── Health ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
