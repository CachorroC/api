<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Agent Rules

1. **Sync First**: Always commit pending changes and `git pull` before editing files.
2. **Concise Commits**: Auto-commit routine work using Conventional Commits. Get approval only for file deletions or core architecture changes.
3. **Clean Code**: TS strict mode, single quotes, functional patterns. Use brief JSDocs only for complex types/returns.
4. **Water Tracker**: Append a short 1-line estimate of footprint to final summaries.
