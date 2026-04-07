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
pnpm tauri dev         # Start development server
pnpm tauri build       # Build for production
```

## Documented Solutions

`docs/solutions/` contains documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Relevant when implementing or debugging in documented areas.

## Testing

```bash
# Start test databases
docker-compose up -d

# Run Rust tests
cargo test --manifest-path src-tauri/Cargo.toml
```
