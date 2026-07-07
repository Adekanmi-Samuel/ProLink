const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const jwt = require('jsonwebtoken');

const logger = require('./src/config/logger');
const httpLogger = require('./src/middleware/httpLogger');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const { attachRedisAdapter } = require('./src/config/socketAdapter');
const { runAutoRelease } = require('./src/jobs/autoReleaseMilestones');

const app = express();
const server = http.createServer(app);

// Trust proxy for rate limiting behind reverse proxies (Render, Vercel, etc.)
app.set('trust proxy', 1);

// Security middleware
// ── Helmet security headers ──────────────────────────────────
// Configured explicitly for ProLink's stack.
// The API runs on Render (api.prolink.ng or similar).
// The frontend runs on Vercel (prolink-eight.vercel.app).
// Paystack webhooks come from Paystack's servers.
// Cloudinary callbacks come from Cloudinary.
app.use(
  helmet({
    // Content-Security-Policy for the API itself.
    // The API returns JSON — it doesn't render HTML pages —
    // so the CSP here is minimal. The main CSP is on the frontend.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'none'"],       // API never executes scripts
        styleSrc: ["'none'"],        // API never loads styles
        imgSrc: ["'none'"],          // API never loads images
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],  // API pages should never be iframed
        upgradeInsecureRequests: [],
      },
    },

    // X-Frame-Options: DENY for the API
    // (API responses should never be framed)
    frameguard: { action: "deny" },

    // X-Content-Type-Options: nosniff
    noSniff: true,

    // Strict-Transport-Security
    // 1 year (31536000s), includeSubDomains, preload eligible
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },

    // Referrer-Policy
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },

    // X-DNS-Prefetch-Control: off
    // Prevents browsers from prefetching DNS for links in API responses
    dnsPrefetchControl: { allow: false },

    // X-Download-Options: noopen (IE specific, harmless elsewhere)
    ieNoOpen: true,

    // X-XSS-Protection: 0
    // Modern best practice is to DISABLE the old XSS filter (it can
    // actually create vulnerabilities in older browsers). CSP is better.
    xssFilter: false,

    // Cross-Origin-Resource-Policy
    // "cross-origin" — the frontend (Vercel) and backend (Render) are
    // different origins. "same-site" would only work if both are under
    // the same domain hierarchy (e.g., api.prolink.ng + prolink.ng).
    // Since they're on different TLDs, use "cross-origin".
    crossOriginResourcePolicy: {
      policy: "cross-origin",  // Required for Vercel → Render API calls
    },

    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: {
      policy: "same-origin",
    },

    // Cross-Origin-Embedder-Policy
    // "unsafe-none" because Paystack and Cloudinary don't send CORP headers.
    // If they ever do, switch to "require-corp".
    crossOriginEmbedderPolicy: false,   // false = don't set COEP (let it be unsafe-none)
  })
);
app.use(compression());
app.use(hpp());

// ── Permissions-Policy (not yet in Helmet 7 — set manually) ──
app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",        // API never initiates payments directly
      "usb=()",
      "serial=()",
      "battery=()",
      "display-capture=()",
    ].join(", ")
  );
  next();
});

// Body parsing with size limits and rawBody for webhook validation
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    // Only capture rawBody for webhook routes to save memory
    if (req.originalUrl && req.originalUrl.includes('/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// HTTP request logging
app.use(httpLogger);

// CORS - restrict to known origins
// Production domains hardcoded (safety net since .env not in git)
const ALLOWED_DOMAINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://prolink-eight.vercel.app',
];

// Add FRONTEND_ORIGIN from env if set
if (process.env.FRONTEND_ORIGIN) {
  ALLOWED_DOMAINS.push(process.env.FRONTEND_ORIGIN);
}

// In production, strictly enforce FRONTEND_ORIGIN
// ALLOWED_DOMAINS.push(/\.vercel\.app$/); // REMOVED FOR SECURITY (Issue #2)

const allowedOrigins = ALLOWED_DOMAINS;

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Normalize: strip trailing slash before comparison
    const normalized = origin.replace(/\/+$/, '');
    const matched = allowedOrigins.some(a => {
      if (a instanceof RegExp) return a.test(normalized);
      return a.replace(/\/+$/, '') === normalized;
    });
    if (matched) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Socket.io with same CORS policy
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // For Vercel: disable WebSockets, use polling only
  transports: process.env.VERCEL
    ? ['polling']
    : ['websocket', 'polling'],
  allowEIO3: true,
});

// Rate limiting
app.use(generalLimiter);

// Make io accessible to controllers
app.set('io', io);

// Routes
const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profiles');
const jobRoutes = require('./src/routes/jobs');
const chatRoutes = require('./src/routes/chats');
const moderationRoutes = require('./src/routes/moderation');
const reviewRoutes = require('./src/routes/reviews');
const adminRoutes = require('./src/routes/admin');
const milestonesRoutes = require('./src/routes/milestones');
const paymentsRoutes = require('./src/routes/payments');
const disputesRoutes = require('./src/routes/disputes');
const taxonomyRoutes = require('./src/routes/taxonomy');
const searchRoutes = require('./src/routes/search');
const recommendationsRoutes = require('./src/routes/recommendations');
const savedSearchesRoutes = require('./src/routes/savedSearches');
const portfolioRoutes = require('./src/routes/portfolio');
const verificationRoutes = require('./src/routes/verification');
const uploadRoutes = require('./src/routes/uploadRoutes');
const notificationRoutes = require('./src/routes/notifications');
const statsRoutes = require('./src/routes/stats');
const savedJobsRoutes = require('./src/routes/savedJobs');

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/milestones', milestonesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/disputes', disputesRoutes);
app.use('/api/taxonomy', taxonomyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/saved_searches', savedSearchesRoutes);
app.use('/api/saved_jobs', savedJobsRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);

// Serve uploaded files (local fallback for when Cloudinary is not configured)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health + Load Balancer endpoints
const healthRoutes = require('./src/routes/health');
app.use('/health', healthRoutes);

// Initialize core services
require('./src/events/EventBus');
const cacheService = require('./src/cache/CacheService');

// Start scheduled jobs (auto-release stale milestones)
// Cron jobs don't run on Vercel serverless
if (!process.env.VERCEL) {
  try {
    require('./src/jobs/autoReleaseMilestones');
  } catch (cronErr) {
    console.warn('[CRON] Auto-release job failed to start:', cronErr.message);
  }
}

// Global error handler (must be last)
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

// ========================================
// Socket.IO Setup
// ========================================

// Socket.IO authentication middleware
io.use((socket, next) => {
  let token = socket.handshake.auth?.token;

  // Fallback: try reading token from cookie (httpOnly cookie sent withCredentials)
  if (!token) {
    const cookieHeader = socket.handshake.headers?.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
      if (match) {
        token = match[1];
      }
    }
  }

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.user.id;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

// Initialize Socket.IO event handlers
const { initializeSocketHandlers } = require('./src/socket/handlers');
const { setIo } = require('./src/socket');
setIo(io);
initializeSocketHandlers(io);

// Attach Redis adapter for horizontal scaling (if REDIS_URL is set)
attachRedisAdapter(io).catch(err => {
  logger.warn('Redis adapter not attached', { error: err.message });
});

// ========================================
// Graceful Shutdown
// ========================================
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    const prisma = require('./src/config/prisma');
    await prisma.$disconnect();
    await cacheService.shutdown();
    logger.info('Prisma and cache disconnected');
  } catch (err) {
    logger.error('Error during shutdown', { error: err.message });
  }

  io.close(() => {
    logger.info('Socket.IO closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Graceful shutdown handlers don't apply on Vercel serverless
if (!process.env.VERCEL) {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

const PORT = process.env.PORT || 5000;

// Export for Vercel serverless
// On Vercel: module.exports = app (no server.listen needed)
// On Render/local: listen normally
if (process.env.VERCEL) {
  module.exports = app;
} else {
  server.listen(PORT, () => {
    logger.info(`ProLink backend started`, {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      cors: allowedOrigins,
    });
  });
  module.exports = app;
}
