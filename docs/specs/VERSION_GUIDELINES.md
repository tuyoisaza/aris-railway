# ARIS Development Guidelines

## Version Management

### Version Number Location
- **File**: `VERSION` (root directory)
- **Public**: `public/VERSION.txt` (auto-copied during build)
- **Display**: Top-left corner of app in `MainLayout.tsx`

### Version Display & Support Copy
- Version is displayed in the top-left corner with a copy button
- Copy button captures: version number, domain, URL, timestamp, and all console logs
- Clicking copy creates a formatted support report ready to paste

### Commit Convention
- Each commit auto-increments the version in `VERSION` file (via `.git/hooks/pre-commit`)
- Commit messages should reflect the version being released
- Example: `git commit -m "feat: add new feature (v0.0.12)"`

## Login Page
- Version number should be displayed on the login page for easy reference
- Include support copy button if errors occur during login

## Support Workflow
1. User clicks copy button next to version
2. System copies: version, domain, URL, console logs
3. User pastes into issue report
4. Include brief description of issue

## File Structure
```
VERSION                    # Current version number (auto-incremented)
public/VERSION.txt         # Served version for frontend
src/
  layout/MainLayout.tsx    # Version display component
  hooks/useConsoleCapture.ts # Console log capture hook
docs/
  specs/VERSION_GUIDELINES.md  # This file
CONTEXT.md                 # Canonical context file for AI
```

## Reading Context
- **CONTEXT.md** in root: Always read this file first for project context
- Contains: current goals, recent changes, known issues, URLs
