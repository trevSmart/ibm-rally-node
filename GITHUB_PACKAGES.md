# GitHub Packages Publishing Guide

## Prerequisites

1. **GitHub Personal Access Token**: Create a token with `write:packages` permission
2. **Authentication**: Set the token as environment variable or in `.npmrc`

## Publishing Steps

### 1. Set up authentication

```bash
# Option A: Environment variable (recommended)
export GITHUB_TOKEN=your_github_token_here

# Option B: Direct in .npmrc (already configured)
# The .npmrc file is already set up with:
# @trevsmart:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### 2. Build and publish

```bash
# Build the project
npm run build

# Publish to GitHub Packages
npm publish
```

### 3. Verify publication

Check the package at: https://github.com/trevSmart/rally-node/packages

## Installation for Users

Users need to configure their `.npmrc` to use GitHub Packages:

```bash
# Add to user's .npmrc
echo "@trevsmart:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc
```

Then install:
```bash
npm install @trevsmart/rally-node
```

## Package Information

- **Package Name**: `@trevsmart/rally-node`
- **Registry**: GitHub Packages (`https://npm.pkg.github.com`)
- **Repository**: `https://github.com/trevSmart/rally-node`
- **Current Version**: `0.0.1`

## Notes

- The package is scoped under `@trevsmart` organization
- Users need `read:packages` permission to install
- Publishers need `write:packages` permission to publish
- The package is private by default on GitHub Packages
