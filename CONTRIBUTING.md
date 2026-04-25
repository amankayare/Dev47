# Contributing to Dev47

Welcome to the Dev47 project! This document outlines the standard development workflow and guidelines for contributing to this repository.

## Branching Strategy & Workflow

We follow a strict feature-branch workflow. **Direct pushes to the `main` branch are strictly prohibited and blocked by repository rules.**

All development must follow this process:

### 1. Sync Your Local Repository
Before starting any new work, ensure your local `main` branch is up to date:
```bash
git checkout main
git pull origin main
```

### 2. Create a Feature Branch
Create a new branch off of `main` for your work. Use a descriptive prefix to categorize the branch:
- `feature/` - For new features or significant additions
- `fix/` - For bug fixes
- `refactor/` - For code restructuring without behavior changes
- `docs/` - For documentation updates

```bash
# Example
git checkout -b feature/update-navbar
```

### 3. Make Changes and Commit
Make your changes locally. We prefer clean, atomic commits. Please use descriptive commit messages:
```bash
git add .
git commit -m "feat: updated the navigation bar responsiveness for mobile devices"
```

### 4. Push Your Branch
Push your feature branch to the remote repository:
```bash
git push -u origin feature/update-navbar
```

### 5. Create a Pull Request (PR)
1. Go to the GitHub repository.
2. Open a new Pull Request comparing your feature branch against `main`.
3. Provide a clear description of the changes you made and why.
4. Request a review.

### 6. Merge and Deploy
Once your PR is approved, it can be merged into `main` using the GitHub UI.
After merging, the code is ready for deployment. Deployment to the Hostinger production server is handled manually via the GitHub Actions **Deploy to VPS** workflow using the `main` branch.

## Getting Started Locally

To run the application locally for development:

1. **Frontend (React/Vite)**
   ```bash
   cd web
   npm install
   npm run dev
   ```
2. **Backend (Python/Flask)**
   ```bash
   cd scripts
   # Activate your virtual environment first
   python start.py
   ```

Happy coding!
