---
description: Fetch a Shortcut story, brainstorm solution, write plan, and execute it
args:
  - name: story_id
    description: The Shortcut story ID to work on
    required: true
---

# Shortcut Story Solution Workflow

You are working on the DishDash project. Please read the following context files:

- @project-details.md - Contains the full project brief and 3-week challenge timeline
- @dish-dash-overview.md - Contains the project overview, technical stack, and implementation details

## Your Task

1. **Fetch the Shortcut Story**: Use the Shortcut MCP server to get the details of story #{{story_id}}
   - Use `mcp__shortcut__stories-get-by-id` with `storyPublicId: {{story_id}}` and `full: true`

2. **Create and Checkout Feature Branch**: After fetching the story details:
   - Use `mcp__shortcut__stories-get-branch-name` with `storyPublicId: {{story_id}}` to get the proper branch name
   - Create and checkout the new branch using `git checkout -b <branch-name>`
   - This ensures you're working on a dedicated feature branch for this story

3. **Brainstorm the Solution**: Use the `/superpowers:brainstorm` slash command to:
   - Analyze the story requirements in the context of the DishDash project
   - Consider the technical stack (Next.js 16, NextAuth v5, Vercel Postgres, etc.)
   - Explore different approaches and implementation strategies
   - Identify potential challenges and edge cases
   - Ensure the solution aligns with the project's goals and timeline

4. **Write the Implementation Plan**: Use the `/superpowers:write-plan` slash command to:
   - Create a detailed, step-by-step implementation plan
   - Include specific file paths where code changes are needed
   - Provide code examples for key implementations
   - Define acceptance criteria and testing requirements
   - Consider PWA/offline capabilities if relevant
   - Account for authentication, security, and data validation
   - **IMPORTANT**: Break the plan into logical milestones/batches that can be committed separately

5. **Execute the Plan**: Use the `/superpowers:execute-plan` slash command to:
   - Implement the solution following the plan
   - Work in controlled batches with review checkpoints
   - **After each logical batch/milestone**, use `/commit-checkpoint` to create an atomic commit
   - Test each component as you build it
   - Ensure code quality and best practices

## Commit Strategy

- Create **multiple atomic commits** throughout the implementation
- Use `/commit-checkpoint <scope>` after completing each logical milestone
- Examples of good commit points:
  - After setting up initial file structure
  - After implementing database schema/models
  - After completing API routes
  - After building UI components
  - After adding validation and error handling
  - After writing tests
- Each commit should represent one cohesive change that could theoretically be reviewed independently

## Important Considerations

- This is a mobile-first PWA, so prioritize mobile UX
- Follow the authentication patterns (NextAuth v5 with magic link + Google)
- Use the established database schema (Users, Restaurants, Friends, Visits, TodoEatList, etc.)
- Implement proper role-based access control (Admin vs User)
- Add offline/PWA capabilities where appropriate
- Follow the project's styling approach (Tailwind CSS)
- Ensure proper error handling and input validation

## Output Format

After fetching the story, clearly state:
1. The story title and description
2. The epic/iteration it belongs to (if any)
3. The feature branch you created and checked out
4. Your understanding of the requirements
5. Then proceed with brainstorming, planning, and execution

Begin by fetching story #{{story_id}} now.
