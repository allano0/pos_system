# POS System - Automatic Update Setup Guide

This guide will help you set up automatic updates for your POS system using GitHub releases.

## Prerequisites

1. A GitHub repository for your POS system
2. GitHub Personal Access Token with repo permissions
3. Node.js and npm installed

## Setup Steps

### 1. Update GitHub Configuration

Edit `electron-builder.yml` and replace `YOUR_GITHUB_USERNAME` with your actual GitHub username:

```yaml
publish:
  provider: github
  owner: YOUR_GITHUB_USERNAME  # Replace with your GitHub username
  repo: pos_system            # Replace with your repository name
  private: false
  releaseType: release
```

### 2. Set Up GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` permissions
3. Set the token as an environment variable:

**Windows:**
```cmd
set GH_TOKEN=your_github_token_here
```

**macOS/Linux:**
```bash
export GH_TOKEN=your_github_token_here
```

### 3. Build and Publish

To create an installer with automatic updates:

**For Windows:**
```bash
npm run dist:win
```

**For macOS:**
```bash
npm run dist:mac
```

**For Linux:**
```bash
npm run dist:linux
```

### 4. Using the Update Component

The `UpdateChecker` component is now available for use in your application. You can import and use it in any page:

```tsx
import UpdateChecker from '../components/UpdateChecker'

// In your component:
<UpdateChecker />
```

## How It Works

1. **Automatic Check**: The app automatically checks for updates when it starts (in production builds)
2. **Manual Check**: Users can click the "Check for Updates" button
3. **Download**: When an update is available, users can download it
4. **Install**: After download, users can install and restart the app

## Release Process

### Creating a New Release

1. Update the version in `package.json`
2. Commit and push your changes
3. Create a GitHub release with the same version tag
4. Run the build command for your target platform

### Example Release Workflow

```bash
# 1. Update version
npm version patch  # or minor/major

# 2. Commit changes
git add .
git commit -m "Release v1.0.1"
git push

# 3. Create GitHub release (manually or via GitHub CLI)
gh release create v1.0.1 --generate-notes

# 4. Build and publish
npm run dist:win  # or dist:mac/dist:linux
```

## File Structure

```
pos_system/
├── electron-builder.yml          # Build configuration
├── src/
│   ├── main/
│   │   └── index.ts             # Main process with update logic
│   ├── preload/
│   │   ├── index.ts             # Preload script with update APIs
│   │   └── index.d.ts           # TypeScript definitions
│   └── renderer/
│       └── src/
│           ├── components/
│           │   └── UpdateChecker.tsx  # Update UI component
│           └── env.d.ts         # Global type definitions
└── package.json                 # Build scripts
```

## Troubleshooting

### Common Issues

1. **Update not found**: Make sure the GitHub release exists and is public
2. **Authentication errors**: Verify your GH_TOKEN is set correctly
3. **Build failures**: Ensure all dependencies are installed (`npm install`)

### Debug Mode

To test updates in development:

```bash
# Set debug mode
set DEBUG=electron-builder
npm run dist:win
```

### Manual Update Check

You can also trigger manual update checks from the main process:

```typescript
import { autoUpdater } from 'electron-updater'
autoUpdater.checkForUpdates()
```

## Security Notes

- Keep your GitHub token secure and never commit it to version control
- Consider using GitHub Actions for automated releases
- Test updates thoroughly before publishing

## Next Steps

1. Set up GitHub Actions for automated releases
2. Add update notifications in your app
3. Implement rollback functionality
4. Add update progress indicators

For more information, see the [electron-updater documentation](https://www.electron.build/auto-update). 