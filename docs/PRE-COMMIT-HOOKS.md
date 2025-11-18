# Pre-Commit Hooks Documentation

This project uses automated pre-commit hooks to ensure code quality and consistency.

## What Happens on Commit?

When you run `git commit`, the following tools automatically run on your **staged files**:

### 1. **Prettier** - Code Formatter

- Formats code to consistent style
- Fixes indentation, spacing, quotes, etc.
- Runs on: `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css`, `.md`
- Auto-fixes and stages changes

### 2. **ESLint** - Code Linter

- Checks for code quality issues
- Finds bugs, unused variables, bad patterns
- Runs on: `.ts`, `.tsx`, `.js`, `.jsx`
- Auto-fixes issues when possible

### 3. **TypeScript Type Check** - Type Safety

- Verifies TypeScript types are correct
- Catches type errors before commit
- Runs on: `.ts`, `.tsx`
- Only checks staged files (fast!)

## Tools Used

- **Husky**: Git hooks management
- **lint-staged**: Runs tools only on staged files (fast!)
- **Prettier**: Code formatting
- **ESLint**: Linting
- **tsc-files**: Fast TypeScript checking

## Configuration Files

- `.husky/pre-commit` - Hook script
- `.prettierrc.json` - Prettier configuration
- `.prettierignore` - Files to skip formatting
- `package.json` - lint-staged configuration
- `eslint.config.js` - ESLint rules

## Manual Commands

You can run these commands manually:

```bash
# Format all files in src/
npm run format

# Check formatting without changing files
npm run format:check

# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Type check entire project
npm run type-check

# Build (includes type checking)
npm run build
```

## What Gets Checked?

### TypeScript/TSX Files (`.ts`, `.tsx`)

1. ✨ Prettier formatting
2. 🔍 ESLint linting + auto-fix
3. 🔷 TypeScript type checking

### JavaScript/JSX Files (`.js`, `.jsx`)

1. ✨ Prettier formatting
2. 🔍 ESLint linting + auto-fix

### Other Files (`.json`, `.css`, `.md`)

1. ✨ Prettier formatting

## Example Workflow

### Normal Commit (Passes)

```bash
# Make changes
vim src/components/Scene3D.tsx

# Stage changes
git add src/components/Scene3D.tsx

# Commit (pre-commit hook runs automatically)
git commit -m "feat: add new feature"

# Output:
🔍 Running pre-commit checks...
✨ Prettier: Formatting...
🔍 ESLint: Checking...
🔷 TypeScript: Type checking...
✅ Pre-commit checks passed!
[main abc1234] feat: add new feature
```

### Failed Commit (Has Errors)

```bash
# Stage files with errors
git add src/components/Scene3D.tsx

# Try to commit
git commit -m "feat: broken code"

# Output:
🔍 Running pre-commit checks...
❌ ESLint: Found 3 errors
  - Unused variable 'foo' at line 42
  - Missing return type at line 58
❌ Pre-commit checks failed! Please fix the errors above.

# Fix the errors
vim src/components/Scene3D.tsx

# Try again
git add src/components/Scene3D.tsx
git commit -m "feat: working code"
✅ Pre-commit checks passed!
```

## Prettier Configuration

File: `.prettierrc.json`

```json
{
  "semi": true, // Use semicolons
  "trailingComma": "es5", // Trailing commas where valid in ES5
  "singleQuote": true, // Use single quotes
  "printWidth": 100, // Line width 100 chars
  "tabWidth": 2, // 2 spaces per tab
  "useTabs": false, // Use spaces, not tabs
  "arrowParens": "always", // (x) => x not x => x
  "bracketSpacing": true, // { foo } not {foo}
  "endOfLine": "lf" // Unix line endings
}
```

## Bypassing Hooks (Not Recommended!)

In rare cases, you may need to skip hooks:

```bash
# Skip pre-commit hooks (USE WITH CAUTION!)
git commit --no-verify -m "emergency fix"
```

⚠️ **Warning**: Only use `--no-verify` for:

- Emergency hotfixes
- When hooks are broken
- Generated/imported code

**Never** use it to bypass legitimate errors!

## Troubleshooting

### Hook doesn't run

```bash
# Reinstall hooks
npm run prepare

# Or manually
npx husky install
```

### Hook fails with permission error

```bash
chmod +x .husky/pre-commit
```

### False positive errors

1. Check if your code actually has the error
2. Update ESLint config if rule is wrong
3. Add ESLint disable comment if truly necessary:
   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const foo: any = bar;
   ```

### Prettier and ESLint conflict

- Our configs are designed to work together
- Prettier handles formatting
- ESLint handles code quality
- If conflict occurs, Prettier wins (run `npm run format` first)

### Slow pre-commit hook

- Hooks only run on **staged files** (fast!)
- If slow, check number of staged files: `git diff --cached --name-only`
- Consider staging files in smaller batches

## Benefits

✅ **Consistent code style** - Team follows same formatting
✅ **Catch errors early** - Before they reach CI/CD
✅ **Cleaner git history** - No "fix linting" commits
✅ **Faster reviews** - No style discussions
✅ **Better code quality** - Automatic best practices
✅ **Type safety** - TypeScript errors caught immediately

## Best Practices

1. **Stage frequently** - Small commits are faster to check
2. **Fix errors immediately** - Don't let them accumulate
3. **Trust the tools** - They know formatting better than humans
4. **Keep configs updated** - Review rules periodically
5. **Don't bypass hooks** - They exist for good reason

## Adding New Rules

### Add ESLint Rule

Edit `eslint.config.js`:

```javascript
rules: {
  'no-console': 'warn',  // Add new rule
}
```

### Add Prettier Setting

Edit `.prettierrc.json`:

```json
{
  "printWidth": 120 // Change setting
}
```

### Add File Type to lint-staged

Edit `package.json`:

```json
"lint-staged": {
  "*.html": [
    "prettier --write"
  ]
}
```

## Disabling Hooks (Temporarily)

To disable hooks for maintenance:

```bash
# Move hook file
mv .husky/pre-commit .husky/pre-commit.disabled

# Re-enable later
mv .husky/pre-commit.disabled .husky/pre-commit
chmod +x .husky/pre-commit
```

## Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Prettier Documentation](https://prettier.io/docs/)
- [ESLint Documentation](https://eslint.org/docs/)
- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
