# Changelog

All notable changes to this project will be documented in this file.

The current release-notes policy is to keep GitHub's `gh release create --generate-notes` automation for now and maintain this changelog manually. Revisit release-please if the release cadence becomes high enough to justify its overhead.

## [0.1.0] - 2026-05-09

### Added

- Initial public release of `ku-signal`
- Typed K-Wire protocol schemas, runner loop, provider registry, and Ink TUI
- Cross-platform binary publishing via Bun compile in the release workflow

### Changed

- Replaced the earlier GoReleaser release path with Bun-based binary packaging and GitHub release uploads

### Fixed

- Unblocked binary compilation by stubbing Ink's optional `react-devtools-core` dependency during release work
