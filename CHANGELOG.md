# Changelog

All notable changes to Sentra will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Automated build and release pipeline for all platforms
- Version management script for easy version bumping
- Auto-update system using Tauri updater plugin
- Comprehensive release process documentation

### Changed
- Enhanced CI/CD with multi-platform builds
- Improved GitHub Actions workflows for quality gates

### Fixed
- Various bug fixes and improvements

## [0.1.0] - 2025-11-13

### Added
- Initial release of Sentra AI Agent Control Center
- Native macOS desktop application built with Tauri 2.x
- Next.js 15 frontend with App Router and React Server Components
- Multi-project dashboard for managing AI-powered projects
- Real-time project monitoring and activity tracking
- Cost tracking and analytics for API usage
- Spec approval workflow for AI agent tasks
- Pull request review interface integrated with GitHub
- Voice notification system with per-project controls
- Claude Code CLI integration for agent execution
- Docker containerization for secure agent isolation (Phase 1)
- Credential proxy service architecture (Phase 2 ready)
- TypeScript strict mode with comprehensive type safety
- Full test infrastructure (unit, integration, E2E)
- 75%+ code coverage with quality gates
- Professional dark theme with violet accents
- Template system for reusable components
- Architect chat interface for project planning
- Git integration for status, diff, and log viewing
- Performance monitoring and telemetry

### Security
- Phase 1 container security with Docker isolation
- Read-only root filesystem
- Non-root user execution
- Capability dropping (CAP_DROP=ALL)
- Resource limits (2GB RAM, 2 CPU cores)
- Security architecture documented for Phase 2-3

---

**Release Notes**

This is the initial development release of Sentra. The platform is under active development and may have breaking changes between versions.

For detailed release information and documentation, visit:
- [Release Process](docs/RELEASE-PROCESS.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Architecture Documentation](docs/architecture/)
