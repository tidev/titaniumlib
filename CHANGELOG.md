# v2.1.0 (Jan 13, 2020)

 * feat: Added `onProgress()` callback to SDK's `install()`.
 * feat: Added current file index and total entries arguments to `extractZip()`'s `onEntry`
   callback.
 * chore: Updated dependencies.

# v2.0.1 (Sep 26, 2019)

 * fix(sdk): Maintain file permissions on SDK extraction.

# v2.0.0 (Aug 14, 2019)

 * BREAKING CHANGE: Bumped minimum required Node.js version from v8.0.0 to v8.12.0.
 * chore: Updated dependencies.

# v1.4.0 (Jul 8, 2019)

 * fix: Updated `releases.json` URL to use the virtual-hosted style URL instead of the path-style
   URL (https://forums.aws.amazon.com/ann.jspa?annID=6776).
 * fix(util): Removed creation of error instance in catch causing original error stack to be lost.
 * chore: Updated dependencies.

# v1.3.1 (Apr 24, 2019)

 * refactor: Added `name` to SDK object returned from `getReleases()`.

# v1.3.0 (Apr 23, 2019)

 * fix: Added missing source-map-support dependency.

# v1.2.0 (Mar 29, 2019)

 * chore: Updated dependencies.

# v1.1.1 (Mar 8, 2019)

 * fix: Fixed how option searchPaths are used.
 * fix: Fixed network options and added buildRequestParams() util function.
 * BREAKING CHANGE: Bumped required Node.js version from 8.0.0 to 8.10.0.

# v1.1.0 (Mar 6, 2019)

 * Upgraded to Gulp 4.
 * Migrated functions for getting builds, releases, installing SDKs, and uninstalling SDKs from
   appcd-plugin-titanium-sdk.
 * Updated dependencies.

# v1.0.0 (Mar 22, 2018)

  * Initial release.
