# InsightAI Backend — "Turn your data into decisions."

Production-grade, scalable, secure, and modular backend for the **InsightAI** data analytics SaaS application.

Built with **Node.js, TypeScript, Express.js, Supabase (PostgreSQL & Auth), and Mistral AI**.

---

## 1. Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # Zod-validated environment variables
│   │   ├── supabase.ts         # Supabase client (Anon & Service Role)
│   │   └── mistral.ts          # Mistral AI SDK client initialization
│   ├── controllers/
│   │   ├── ai.controller.ts    # AI questions, executive summary, insights
│   │   ├── analysis.controller.ts # Deterministic query & analytics engine
│   │   ├── anomaly.controller.ts  # Statistical anomaly detection & resolution
│   │   ├── auth.controller.ts     # User session sync & current user
│   │   ├── dataset.controller.ts  # Upload, list, preview, statistics, delete
│   │   ├── insight.controller.ts  # Automated business insights
│   │   ├── report.controller.ts   # Report generation and management
│   │   └── user.controller.ts     # User profiles
│   ├── db/
│   │   └── migrations/
│   │       └── 001_initial_schema.sql # Database schema, RLS, Indexes, Triggers
│   ├── middleware/
│   │   ├── auth.middleware.ts       # Supabase Bearer token verification
│   │   ├── error.middleware.ts      # Standardized error response handler
│   │   ├── rate-limit.middleware.ts # Rate limiting (API, AI, Upload)
│   │   ├── upload.middleware.ts     # Multer CSV/XLSX file handling
│   │   └── validation.middleware.ts # Zod schema validator
│   ├── routes/
│   │   ├── ai.routes.ts
│   │   ├── analysis.routes.ts
│   │   ├── anomaly.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── dataset.routes.ts
│   │   ├── index.ts                 # Router aggregator under /api/v1
│   │   ├── insight.routes.ts
│   │   ├── report.routes.ts
│   │   └── user.routes.ts
│   ├── services/
│   │   ├── ai.service.ts            # Mistral AI integration & prompt logic
│   │   ├── analytics.service.ts     # Aggregations, group-by, Z-score/IQR
│   │   ├── anomaly.service.ts       # Statistical anomaly persistence
│   │   ├── auth.service.ts          # User profile auto-creation & sync
│   │   ├── data-processing.service.ts # Streaming CSV & Excel parsing
│   │   ├── data-quality.service.ts    # Health score & completeness engine
│   │   ├── dataset.service.ts       # Dataset storage & preview service
│   │   ├── insight.service.ts       # Business insight generator
│   │   ├── report.service.ts        # Report compiler service
│   │   └── user.service.ts          # User profile service
│   ├── tests/
│   │   ├── ai.test.ts
│   │   ├── analytics.test.ts
│   │   ├── auth.test.ts
│   │   └── setup.ts
│   ├── types/
│   │   ├── ai.ts
│   │   ├── analysis.ts
│   │   ├── auth.ts
│   │   ├── common.ts
│   │   ├── dataset.ts
│   │   ├── insight.ts
│   │   └── report.ts
│   ├── utils/
│   │   ├── csv-parser.ts
│   │   ├── data-utils.ts
│   │   ├── errors.ts
│   │   ├── excel-parser.ts
│   │   ├── logger.ts
│   │   └── pagination.ts
│   ├── validators/
│   │   ├── ai.validator.ts
│   │   ├── analysis.validator.ts
│   │   ├── auth.validator.ts
│   │   ├── dataset.validator.ts
│   │   └── report.validator.ts
│   ├── app.ts                        # Express application configuration
│   └── server.ts                     # Server entry point
├── .dockerignore
├── .env.example
├── Dockerfile
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## 2. Installation Commands

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run build to compile TypeScript
npm run build
```

---

## 3. Environment Variable Documentation

Create a `.env` file inside `backend/`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Mistral AI Configuration
MISTRAL_API_KEY=your-mistral-api-key
MISTRAL_MODEL=mistral-large-latest

# Limits & Security
MAX_FILE_SIZE_MB=50
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 4. Supabase Setup Instructions

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project named **InsightAI**.
3. Under **Project Settings -> API**, copy:
   - Project URL -> `SUPABASE_URL`
   - `anon` `public` key -> `SUPABASE_ANON_KEY`
   - `service_role` `secret` key -> `SUPABASE_SERVICE_ROLE_KEY`
4. Under **Storage**, create a private bucket named `datasets`.

---

## 5. Google OAuth Setup Instructions

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create OAuth 2.0 Credentials (Web Application).
3. Set Authorized Redirect URI:
   `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
4. In Supabase Dashboard -> **Authentication -> Providers -> Google**:
   - Enable Google provider
   - Enter Client ID and Client Secret from Google Cloud Console.

---

## 6. Mistral AI API Setup Instructions

1. Register at [Mistral AI Console](https://console.mistral.ai/).
2. Create an API Key.
3. Add key to `.env`: `MISTRAL_API_KEY=your_key`.

---

## 7. Database Migration Instructions

1. Open Supabase Dashboard -> **SQL Editor**.
2. Copy the contents of `src/db/migrations/001_initial_schema.sql`.
3. Paste and run the query. This creates all 11 tables (`profiles`, `datasets`, `dataset_columns`, `analyses`, `ai_conversations`, `ai_messages`, `insights`, `anomalies`, `reports`, `audit_logs`, `ai_usage`), Row Level Security policies, indexes, and automatic triggers.

---

## 8. Local Development Instructions

```bash
# Start development server with auto-reload
npm run dev
```

Server will start on `http://localhost:5000`.

---

## 9. API Documentation

All endpoints return a standardized JSON format:

```json
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "DATASET_NOT_FOUND",
    "message": "Dataset not found"
  }
}
```

### Endpoints Overview:

- **Health Check**: `GET /health`
- **Auth**: `GET /api/v1/auth/me`, `POST /api/v1/auth/session`, `POST /api/v1/auth/logout`
- **Datasets**: `POST /api/v1/datasets/upload`, `GET /api/v1/datasets`, `GET /api/v1/datasets/:id`, `GET /api/v1/datasets/:id/preview`, `GET /api/v1/datasets/:id/columns`, `GET /api/v1/datasets/:id/statistics`, `DELETE /api/v1/datasets/:id`
- **AI**: `POST /api/v1/ai/ask`, `POST /api/v1/ai/executive-summary`, `POST /api/v1/ai/insights`, `GET /api/v1/ai/conversations`, `POST /api/v1/ai/conversations`, `GET /api/v1/ai/conversations/:id`, `POST /api/v1/ai/conversations/:id/messages`
- **Analytics**: `POST /api/v1/analysis`
- **Insights**: `GET /api/v1/insights`, `GET /api/v1/insights/:id`
- **Anomalies**: `GET /api/v1/anomalies`, `POST /api/v1/anomalies/:id/resolve`
- **Reports**: `POST /api/v1/reports`, `GET /api/v1/reports`, `GET /api/v1/reports/:id`, `POST /api/v1/reports/:id/generate`, `DELETE /api/v1/reports/:id`
- **User**: `GET /api/v1/user/profile`, `PATCH /api/v1/user/profile`

---

## 10. Deployment Instructions

### Deploy with Docker:
```bash
docker build -t insightai-backend .
docker run -p 5000:5000 --env-file .env insightai-backend
```

### Deploy on Render / Railway / Fly.io:
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment Variables: Set `PORT`, `NODE_ENV`, `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MISTRAL_API_KEY`.

---

## 11. Frontend Integration Instructions

Pass the Supabase Access Token in request headers:
```typescript
const token = (await supabase.auth.getSession()).data.session?.access_token;

const response = await fetch('http://localhost:5000/api/v1/ai/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    datasetId: 'your-dataset-id',
    question: 'Which product generated the highest revenue?'
  })
});
```

---

## 12. Test Instructions

```bash
# Run unit and integration tests
npm test
```
