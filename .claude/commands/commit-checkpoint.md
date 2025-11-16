---
description: Create a git commit at a logical checkpoint with a descriptive message
args:
  - name: scope
    description: Brief description of what was accomplished (e.g., "auth setup", "todo list UI")
    required: false
---

# Commit Checkpoint

Create a well-formatted git commit for the work completed at this checkpoint.

## Instructions

1. **Review Changes**: Run `git status` and `git diff` to see what has changed

2. **Stage Files**: Add the relevant files to staging:
   - If all changes are related to this checkpoint: `git add .`
   - If only specific files should be included: `git add <specific-files>`

3. **Craft Commit Message**: Create a clear, descriptive commit message that:
   - Starts with a verb in present tense (e.g., "Add", "Update", "Fix", "Implement", "Refactor")
   - Summarizes the changes made at this checkpoint
   {{#if scope}}- Focuses on: {{scope}}{{/if}}
   - Is concise but meaningful (1-2 lines for the summary)
   - Includes additional context in the body if needed
   - Follows this format:
     ```
     <type>: <summary>

     <optional body with more details>

     🤖 Generated with [Claude Code](https://claude.com/claude-code)

     Co-Authored-By: Claude <noreply@anthropic.com>
     ```

4. **Commit Types** (choose the most appropriate):
   - `feat`: New feature or functionality
   - `fix`: Bug fix
   - `refactor`: Code restructuring without behavior change
   - `style`: Formatting, styling changes
   - `docs`: Documentation changes
   - `test`: Adding or updating tests
   - `chore`: Build process, dependencies, config changes

5. **Create the Commit**: Use the Bash tool with a heredoc for the commit message

6. **Verify**: Run `git log -1 --oneline` to confirm the commit was created

## Example

If working on authentication setup:
```
feat: Implement NextAuth v5 with magic link and Google OAuth

- Configure NextAuth v5 with email and Google providers
- Add admin role detection for Navin's email
- Set up JWT session strategy
- Create auth configuration and route handlers

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Important Notes

- DO NOT commit files that contain secrets (.env files, credentials, etc.)
- Only commit related changes together - if you have unrelated changes, ask before committing
- Make commits atomic - each commit should represent one logical change
- If there are no changes to commit, inform the user and skip
