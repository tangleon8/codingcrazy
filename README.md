# CodingCrazy - Learn to Code by Playing

A browser-based learn-to-code platform inspired by CodeCombat. Users write JavaScript code to control a character through 2D grid levels, learning programming concepts through interactive puzzles.

## Features

- **Interactive Coding Challenges**: Write real JavaScript to solve puzzles
- **Progressive Difficulty**: 5 levels teaching movement, loops, and timing
- **Real-time Feedback**: Watch your code execute step-by-step
- **Sandboxed Execution**: Safe code execution via Web Workers
- **Progress Tracking**: Track attempts and completions across sessions
- **Admin Level Editor**: JSON-based level editor for creating new challenges

## Tech Stack

### Frontend (apps/web)
- Next.js 14 (App Router)
- React 18 + TypeScript
- TailwindCSS
- Phaser 3 (game rendering)
- Monaco Editor (code editor)

### Backend (apps/api)
- Python FastAPI
- SQLAlchemy 2.0 + Alembic (database)
- PostgreSQL
- Passlib/bcrypt (authentication)

### Shared Packages
- `packages/engine` - Pure TypeScript game simulation logic
- `packages/shared` - Shared types and Zod schemas

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose (for PostgreSQL)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd codingcrazy

# Install Node.js dependencies
npm install

# Install Python dependencies
cd apps/api
pip install -r requirements.txt
cd ../..
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 with:
- User: `codingcrazy`
- Password: `codingcrazy_dev`
- Database: `codingcrazy`

### 3. Run Database Migrations and Seed Data

```bash
# Apply migrations
cd apps/api
alembic upgrade head

# Seed initial levels and admin user
python -m app.seed
cd ../..
```

This creates:
- 5 starter levels with increasing difficulty
- Admin user: `admin@codingcrazy.dev` / `adminpass123`

### 4. Start Development Servers

```bash
# From repo root - starts both API and web servers
npm run dev
```

Or run separately:
```bash
# Terminal 1 - API server (port 8000)
cd apps/api
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Web server (port 3000)
cd apps/web
npm run dev
```

### 5. Open the App

- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Admin Panel: http://localhost:3000/admin (requires admin login)

## Environment Variables

### Frontend (apps/web/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (apps/api/.env)
```env
DATABASE_URL=postgresql://codingcrazy:codingcrazy_dev@localhost:5432/codingcrazy
SECRET_KEY=your-secret-key-change-in-production
COOKIE_SECURE=false
CORS_ORIGINS=["http://localhost:3000"]
DEBUG=true
```

## Project Structure

```
codingcrazy/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/         # Next.js App Router pages
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── lib/         # Utilities and API client
│   │   └── public/          # Static assets (incl. sandbox-worker.js)
│   │
│   └── api/                 # FastAPI backend
│       ├── app/
│       │   ├── core/        # Config, database, security
│       │   ├── models/      # SQLAlchemy models
│       │   ├── routers/     # API route handlers
│       │   └── schemas/     # Pydantic models
│       ├── alembic/         # Database migrations
│       └── tests/           # pytest tests
│
├── packages/
│   ├── engine/              # Game simulation logic
│   │   └── src/
│   │       ├── types.ts     # Core type definitions
│   │       └── simulator.ts # Game state machine
│   │
│   └── shared/              # Shared types & schemas
│       └── src/
│           └── index.ts     # Zod schemas for validation
│
├── docker-compose.yml       # PostgreSQL service
└── package.json             # Monorepo root config
```

## Level JSON Schema

Levels are defined using JSON with the following structure:

```json
{
  "gridWidth": 5,
  "gridHeight": 5,
  "startPosition": { "x": 0, "y": 2 },
  "goals": [{ "x": 4, "y": 2 }],
  "walls": [{ "x": 2, "y": 2 }],
  "coins": [{ "x": 1, "y": 2 }],
  "hazards": [{
    "x": 3,
    "y": 2,
    "pattern": "toggle",
    "activeFrames": [0, 2, 4],
    "type": "spike"
  }],
  "allowedMethods": ["move", "wait"],
  "instructions": "# Level Title\n\nInstructions in markdown...",
  "starterCode": "hero.move(\"right\");",
  "winConditions": {
    "reachGoal": true,
    "collectAllCoins": false
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `gridWidth` | number (3-20) | Width of the game grid |
| `gridHeight` | number (3-20) | Height of the game grid |
| `startPosition` | {x, y} | Hero's starting position |
| `goals` | [{x, y}] | Goal positions (at least one required) |
| `walls` | [{x, y}] | Wall positions (impassable) |
| `coins` | [{x, y}] | Collectible coin positions |
| `hazards` | array | Hazards with position, pattern, and type |
| `allowedMethods` | string[] | API methods available: "move", "wait" |
| `instructions` | string | Level instructions (supports markdown) |
| `starterCode` | string | Initial code in the editor |
| `winConditions` | object | What's required to complete the level |

## Code Execution Sandbox

User code runs in a Web Worker with the following restrictions:

### Available API
```javascript
hero.move("up" | "down" | "left" | "right")  // Move one tile
hero.wait()                                    // Skip a turn
console.log(...)                               // Output to console
```

### Security Measures
- Runs in isolated Web Worker context
- No access to DOM, window, document
- Network APIs (fetch, XHR, WebSocket) are undefined
- 2-second execution timeout
- Maximum 200 actions per run
- Strict mode enforcement

### MVP Limitations
For production, consider additional hardening:
- Use vm2 or isolated-vm for Node.js
- Implement memory limits
- Add prototype pollution protection
- Consider server-side execution with proper sandboxing

## Running Tests

### Backend (pytest)
```bash
cd apps/api
pytest
```

### Engine (vitest)
```bash
npm run test:engine
# or
cd packages/engine
npm test
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login (sets cookie)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Levels
- `GET /api/levels` - List all levels (summary)
- `GET /api/levels/{slug}` - Get level details
- `POST /api/levels` - Create level (admin)
- `PUT /api/levels/{slug}` - Update level (admin)
- `DELETE /api/levels/{slug}` - Delete level (admin)

### Progress
- `GET /api/progress` - Get user's progress on all levels
- `GET /api/progress/{level_id}` - Get progress for specific level
- `POST /api/progress/attempt` - Increment attempt counter
- `POST /api/progress/complete` - Submit level completion

## Development Commands

```bash
# Start all services
npm run dev

# Start only web
npm run dev:web

# Start only API
npm run dev:api

# Run all tests
npm test

# Run database migrations
npm run db:migrate

# Create new migration
npm run db:makemigration "migration name"

# Seed database
npm run db:seed

# Type checking
npm run typecheck
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT
