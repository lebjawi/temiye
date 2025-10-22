# Husky Git Hooks

This directory contains Git hooks managed by Husky for the Tenmiye monorepo.

## Current Hooks

### pre-commit
Runs **lint-staged** before each commit to ensure code quality.

**What it does:**
- Runs ESLint with auto-fix on backend TypeScript files
- Runs Prettier to format backend code
- (Future) Will run linting/formatting on frontend files

**Files checked:**
- `backend/src/**/*.ts` - Backend TypeScript files
- (Future) `frontend/src/**/*.ts` - Frontend TypeScript files

## How It Works

1. You make changes to files
2. You run `git add .`
3. You run `git commit -m "your message"`
4. **Husky intercepts** before commit
5. **lint-staged** runs linters on staged files only
6. If checks pass → commit proceeds
7. If checks fail → commit blocked, fix the issues

## Adding Frontend Hooks

When the frontend is ready, update `/package.json` lint-staged configuration:

```json
"lint-staged": {
  "backend/src/**/*.ts": [
    "cd backend && npm run lint:fix",
    "cd backend && npm run format"
  ],
  "frontend/src/**/*.ts": [
    "cd frontend && npm run lint -- --fix",
    "cd frontend && npm run format"
  ]
}
```

## Bypassing Hooks (Not Recommended)

In emergency situations only:
```bash
git commit --no-verify -m "emergency fix"
```

**Warning:** Only use `--no-verify` for genuine emergencies. Bypassing hooks defeats their purpose.

## Troubleshooting

### Hook not running?
```bash
# Reinstall hooks
rm -rf .husky
npm run prepare
```

### Want to disable temporarily?
```bash
# Rename the hook file
mv .husky/pre-commit .husky/pre-commit.disabled

# Re-enable later
mv .husky/pre-commit.disabled .husky/pre-commit
```
