# Git Commit Command

Create a professional git commit following Conventional Commits specification and best practices.

## Your Task

1. **Analyze Changes**
   - Run `git status` to see modified/untracked files
   - Run `git diff --staged` to see staged changes (if any)
   - Run `git diff` to see unstaged changes
   - Run `git log --oneline -5` to see recent commit style

2. **Determine Commit Type**
   Based on the changes, classify as one of:
   - `feat`: New feature for the user
   - `fix`: Bug fix for the user
   - `docs`: Documentation only changes
   - `style`: Formatting, missing semicolons, etc (no code change)
   - `refactor`: Code change that neither fixes a bug nor adds a feature
   - `perf`: Performance improvements
   - `test`: Adding missing tests or correcting existing tests
   - `chore`: Changes to build process, tooling, dependencies
   - `ci`: Changes to CI configuration files
   - `revert`: Reverts a previous commit

3. **Craft Commit Message**
   Format: `<type>(<scope>): <subject>`

   **Rules:**
   - Subject: max 50 characters, lowercase, no period at end
   - Use imperative mood: "add" not "added" or "adds"
   - Scope: optional, component/file affected (e.g., collision, physics, ui)
   - Body: optional, explain WHAT and WHY (not HOW), wrap at 72 chars
   - Footer: optional, breaking changes or issue references

   **Example:**

   ```
   feat(collision): add particle effects and flash on merge

   - Implement ParticleSystem interface for type safety
   - Add collision event propagation from PhysicsEngine
   - Create visual effects with flash and particle explosion
   - Fix ghost body issue where meshes weren't removed

   This improves user feedback during collisions and makes the
   simulation more visually engaging.

   Fixes #42
   ```

4. **Stage and Commit**
   - If changes are unstaged, ask user which files to stage (show them the list)
   - Stage appropriate files with `git add`
   - Create commit with proper message format
   - NEVER use `git commit --no-verify` unless explicitly requested
   - NEVER amend commits unless explicitly requested
   - Show the created commit with `git log -1 --stat`

5. **Commit Message Template**

   ```
   <type>(<scope>): <subject>

   <body - explain what and why>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

## Important Notes

- Ask user for confirmation before committing
- Don't commit files with secrets (.env, credentials.json, etc)
- Ensure commit message is clear and follows conventions
- Use HEREDOC format for multi-line commit messages
- Check git config for name/email before committing
