# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands
- `yarn start` or `node main.js` - Start the application
- No explicit test or lint commands defined in package.json

## Code Style Guidelines
- **Module System**: Use CommonJS (require/exports) not ES modules
- **Variables**: Use `const` when possible, `let` when needed, never `var`
- **Functions**: Use named functions for primary functionality, arrow functions for callbacks
- **Naming**: camelCase for variables/functions, kebab-case for files
- **Error Handling**: Always wrap async operations in try/catch blocks
- **Logging**: Use utils.log for consistent logging across the application
- **Strings**: Prefer template literals (``) for interpolation and multiline strings
- **Indentation**: 2 spaces
- **Documentation**: Include JSDoc comments for functions
- **Imports**: Group all imports at the top of the file
- **Async Code**: Use async/await for newer code, maintain Promise patterns for existing code
- **Cross-platform**: Use path.resolve for file paths, check OS when needed