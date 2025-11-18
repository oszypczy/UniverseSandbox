# Pull Request Command

Create a professional pull request with proper branch management and description.

## Your Task

### 1. Check Current State

- Run `git status` to see current branch and changes
- Run `git log --oneline main..HEAD` to see commits since main
- Run `git diff main...HEAD --stat` to see file changes summary
- Check if on main branch: `git branch --show-current`

### 2. Branch Management

**If on main branch:**

- Ask user for feature branch name or suggest one based on changes
- Branch naming convention:
  - `feat/short-description` - new features
  - `fix/short-description` - bug fixes
  - `refactor/short-description` - code refactoring
  - `chore/short-description` - maintenance tasks
  - `docs/short-description` - documentation
  - Use kebab-case, max 50 chars
  - Example: `feat/collision-particle-effects`

- Create and switch to new branch: `git checkout -b <branch-name>`
- Push branch: `git push -u origin <branch-name>`

**If on feature branch:**

- Verify branch is up to date with origin
- Check if branch exists on remote: `git ls-remote --heads origin <branch>`
- If not pushed yet, push with: `git push -u origin <branch-name>`

### 3. Analyze Changes

Run commands in parallel:

- `git log main..HEAD --oneline` - list commits
- `git diff main...HEAD --stat` - file changes
- `git diff main...HEAD` - actual code changes (sample if large)

Understand:

- What features/fixes were added?
- What files were changed?
- What's the overall goal of this PR?

### 4. Craft PR Description

**Title Format:**

```
<Type>: <Clear description of what this PR does>
```

Example: `feat: Add collision particle effects and visual feedback`

**Body Format:**

```markdown
## Summary

<!-- 2-4 bullet points explaining the main changes -->

- What was added/changed/fixed
- Why this change was necessary
- Key technical decisions

## Changes

<!-- Grouped by category -->

### Added

- Feature X with Y capability
- Component Z for ABC

### Fixed

- Issue with collision detection
- Ghost body rendering problem

### Changed

- Refactored X for better performance
- Updated Y to use Z pattern

## Technical Details

<!-- Optional: Architecture decisions, trade-offs -->

- Why approach X was chosen over Y
- Performance considerations
- Breaking changes (if any)

## Testing

<!-- How to test/verify the changes -->

- [ ] Test scenario 1
- [ ] Test scenario 2
- [ ] Verify no regressions

## Screenshots/Demo

<!-- If UI changes, add visual proof -->

## Checklist

- [ ] Code follows project conventions
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)
- [ ] No console errors or warnings
- [ ] Reviewed own code

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 5. Create Pull Request

Use GitHub CLI (`gh`):

```bash
gh pr create \
  --title "feat: Add collision particle effects" \
  --body "$(cat <<'EOF'
## Summary
...
EOF
)" \
  --base main \
  --head <branch-name>
```

**Important flags:**

- `--base main` - target branch (always main for this project)
- `--head <branch>` - source branch
- `--draft` - if PR is not ready for review (optional, ask user)
- `--reviewer <username>` - if specific reviewer needed (optional)

### 6. After PR Creation

- Display the PR URL
- Show next steps:

  ```
  ✅ Pull request created successfully!

  🔗 URL: <pr-url>

  Next steps:
  - Review the changes in GitHub
  - Wait for CI checks to complete
  - Request reviews if needed
  - Address any feedback
  - Merge when approved
  ```

## Branch Best Practices

1. **Always branch from main**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/new-feature
   ```

2. **Keep branches focused**
   - One feature/fix per branch
   - Small, reviewable changes
   - Clear purpose and scope

3. **Keep branch up to date**

   ```bash
   git checkout main
   git pull origin main
   git checkout feat/my-feature
   git rebase main  # or merge main
   ```

4. **Clean commit history**
   - Meaningful commit messages
   - Logical commit organization
   - Consider squashing WIP commits

## PR Best Practices

1. **Clear title and description**
   - Explain WHAT and WHY
   - Link to issues if applicable
   - Include testing instructions

2. **Small, focused PRs**
   - Easier to review
   - Faster to merge
   - Less merge conflicts

3. **Self-review first**
   - Read your own code changes
   - Add comments for complex logic
   - Ensure tests pass

4. **Responsive to feedback**
   - Address review comments
   - Explain decisions if needed
   - Be open to suggestions

## Important Notes

- NEVER force push to main
- NEVER create PR from main to main
- Always ensure tests pass before creating PR
- Use `--draft` flag if PR is work in progress
- Add reviewers if known
- Link related issues with "Closes #123" in description
