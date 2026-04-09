# FerrumDB

A cross-platform database management desktop application built with Tauri 2.x, React, and TypeScript.

## Architecture

```
├── src/                    # React frontend (TypeScript)
│   ├── components/         # UI components
│   ├── contexts/           # React contexts
│   └── types/              # TypeScript types
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri IPC commands
│   │   ├── crypto/         # Password encryption (AES-256-GCM + keyring)
│   │   ├── database/       # MySQL/PostgreSQL connectors
│   │   └── storage/        # SQLite persistence
│   └── Cargo.toml
└── docs/
    ├── brainstorms/        # Early-stage ideas
    ├── plans/              # Implementation plans
    └── solutions/          # Documented solutions (bugs, best practices)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Rust, Tauri 2.x, rusqlite, sqlx |
| Databases | SQLite (local), MySQL 8.0+, PostgreSQL 16+ |
| Security | AES-256-GCM encryption, system keyring |

## Development

```bash
pnpm install           # Install dependencies
pnpm run dev           # Browser-only frontend dev with mock backend adapter
pnpm tauri dev         # Start development server
pnpm tauri build       # Build for production
```

### Frontend Mock Development

- `pnpm run dev` runs the React app in a plain browser and uses the frontend backend adapter instead of Tauri IPC.
- In dev mode without a Tauri runtime, frontend data access resolves through a backend adapter layer and then into a browser-side mock backend implementation.
- Mock data is organized by domain and split by responsibility so it can scale with new features without collapsing into one large file.
- The mock backend keeps seed data, state persistence, entity construction, and command handling separated.
- Compatibility shims are acceptable when refactoring mock data internals, as long as the app-facing interface stays stable.
- Mock state is persisted in browser `localStorage`, so manual CRUD testing survives refreshes.
- `pnpm tauri dev` and production builds continue to use real Tauri commands by default.
- Set `VITE_ENABLE_MOCK_BACKEND=true` to force mock mode, or `VITE_ENABLE_MOCK_BACKEND=false` to force real backend mode.

## Documented Solutions

`docs/solutions/` contains documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Relevant when implementing or debugging in documented areas.

## Testing

```bash
# Start test databases
docker-compose up -d

# Run Rust tests
cargo test --manifest-path src-tauri/Cargo.toml
```
