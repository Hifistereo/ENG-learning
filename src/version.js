// Single source of truth for the app version.
//
// Bump APP_VERSION on every release. It drives three things:
//   1. the version badge on the parent page and kid home screen
//   2. the service worker cache name, so a bump forces a clean refresh
//   3. the `appVersion` stamped into exported backup files
//
// SCHEMA_VERSION is separate and only changes when the shape of stored data
// changes in a way that needs a migration in state/storage.js.

export const APP_VERSION = '0.2.0';
export const SCHEMA_VERSION = 2;
export const RELEASE_NAME = 'Piedzīvojums';
