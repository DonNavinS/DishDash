# Generate Shortcut Project from Overview

You are tasked with creating a comprehensive Shortcut project structure (epics and stories) based on the Dish Dash project overview.

## Instructions

1. **Read the Project Overview**
   - Read the file `dish-dash-overview.md` in the project root
   - Analyze the project description, features, timeline, and requirements
   - Identify major feature areas that should become Epics
   - Break down each feature into detailed Stories

2. **Create Epics**
   - For each major phase or feature area in the overview, create a Shortcut Epic
   - Epic naming: Use clear, actionable names (e.g., "User Authentication System", "Offline Functionality")
   - Epic descriptions should include:
     - Overview of what the epic encompasses
     - Key objectives and goals
     - Success criteria
     - Timeline from the project overview

3. **Create Stories**
   - For each Epic, create detailed Stories that break down the work
   - Each Story should follow this structure:
     - **Name**: Clear, specific task (e.g., "Implement user login form")
     - **Description**:
       - User story format: "As a [user type], I want to [action] so that [benefit]"
       - Detailed technical requirements
       - Implementation notes
     - **Acceptance Criteria**: Specific, testable conditions for completion
     - **Story Type**: Feature, Bug, or Chore
     - **Estimate**: If timeline information is available, add story points or time estimates
     - **Labels**: Add relevant labels (e.g., "frontend", "backend", "PWA", "critical")

4. **Story Details Requirements**
   Each story MUST include:
   - Clear technical specifications
   - Dependencies on other stories (if any)
   - Testing requirements
   - Design considerations
   - Any API endpoints or data models needed
   - Offline/PWA considerations if applicable

5. **Use MCP Tools**
   - Use the Shortcut MCP server tools to create epics and stories
   - Link stories to their parent epics
   - Set appropriate workflow states (typically "Ready for Development" or "Backlog")
   - Add story relationships for dependencies

6. **Organization**
   - Create epics in logical order based on project phases
   - Order stories by dependencies and priority
   - Tag stories that are blockers or have dependencies
   - Group related stories together

7. **Output Summary**
   After creating all epics and stories, provide:
   - Total number of epics created
   - Total number of stories created
   - List of epic names with story counts
   - Any warnings about missing information in the overview
   - Suggestions for additional stories or refinements

## Error Handling
- If `dish-dash-overview.md` doesn't exist, inform the user to create it first
- If the overview lacks sufficient detail, ask clarifying questions before creating items
- If MCP tools fail, provide clear error messages and next steps

## Best Practices
- Be specific and actionable in story descriptions
- Include technical details that developers need
- Consider PWA-specific requirements (offline, caching, service workers, etc.)
- Add security considerations where relevant
- Think about responsive design requirements
- Consider accessibility requirements

## Example Story Format

**Name**: Implement Service Worker for Offline Support

**Description**:
As a Dish Dash user, I want the app to work offline so that I can access my saved recipes even without internet connection.

**Technical Requirements**:
- Set up service worker registration in main app file
- Implement caching strategy for static assets (CSS, JS, images)
- Cache recipe data using IndexedDB
- Implement background sync for pending actions
- Add offline indicator in UI

**Acceptance Criteria**:
- [ ] Service worker successfully registers on app load
- [ ] All static assets are cached and served offline
- [ ] User can view previously loaded recipes offline
- [ ] Offline indicator appears when network is unavailable
- [ ] Pending actions sync when connection is restored
- [ ] Cache invalidation works correctly on app updates

**Dependencies**:
- PWA manifest configuration (Story #XXX)
- IndexedDB setup (Story #XXX)

**Labels**: PWA, offline, service-worker, critical

---

Start by reading the `dish-dash-overview.md` file and proceed with epic and story creation.
