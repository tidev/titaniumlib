# Titanium SDK Library

A library of Titanium SDK platform APIs.

### Features

 * Detects installed Titanium SDKs and modules
 * Install or uninstall a Titanium SDKs

### Roadmap

 * Create, build, and clean projects
 * `tiapp.xml` reader/writer
 * Build pipeline
 * Asset management

## Options

`titaniumlib`'s options are set via the `options` export.

```js
import { options } from 'titaniumlib';

options.searchPaths = '/some/path';
```

| Name                           | Description                                                                            | Type                    | Default |
| ------------------------------ | -------------------------------------------------------------------------------------- | ----------------------- | ------- |
| `options.searchPaths`          | Additional path or list of Titanium locations to search for Titanium SDKs and modules. | String or Array[String] | `[]`    |
| `options.network.agentOptions` | Specific agent options like the SSL protocol. See the [agentOptions](https://www.npmjs.com/package/request#using-optionsagentoptions) for more info. | Object | |
| `options.network.caFile`       | Local path to a certificate authority file.                      | String | |
| `options.network.certFile`     | Local path to a PEM formatted certificate.                       | String | |
| `options.network.httpProxy`    | The URL for proxying http requests.                              | String | |
| `options.network.httpsProxy`   | The URL for proxying https requests.                             | String | |
| `options.network.keyFile`      | Local path to a PEM formatted private key.                       | String | |
| `options.network.passphrase`   | The passphrase for the key file.                                 | String | |
| `options.network.strictSSL`    | When `true`, requires SSL certificates be valid.                 | Boolean | `true` |
| `options.sdk.searchPaths`      | Additional path or list of paths to search for Titanium SDKs.    | String or Array[String] | `[]` |
| `options.sdk.urls.branches`    | The URL for the list of branches.                                | String | |
| `options.sdk.urls.build`       | The URL for downloading a CI build `.zip` file.                  | String | |
| `options.sdk.urls.builds`      | The URL for the list of CI builds.                               | String | |
| `options.sdk.urls.releases`    | The URL for the list of GA releases.                             | String | |
| `options.module.searchPaths`   | Additional path or list of paths to search for Titanium modules. | String or Array[String] | `[]` |

### Search Paths

There are different kinds of search paths. `options.searchPaths` is used to find Titanium installation directories. These paths would contain the `"mobilesdk"` and `"modules"` directory. Generally speaking, you probably should use `options.sdk.searchPaths` instead.

`options.sdk.searchPaths` are paths that contain actual SDK directories such as `"7.5.1.GA"`. These paths should _not_ point to the actual SDK directory, but rather its parent directory. `titaniumlib` will only scan the search paths and does not recursively descend directories.

## SDK

```js
import { sdk } from 'titaniumlib';
```

### `sdk.getBranches()`

Retrieves the list of CI branches.

Returns `Promise<Object>`.

```js
const branches = await sdk.getBranches();
console.log(branches);
```

```js
{
  defaultBranch: 'master',
  branches: [
      '3_5_X',
     '4_0_X',
     ...
     '8_0_X',
     'master',
     'next'
  ]
}
```

### `sdk.getBuilds([branch])`

Retreives a list of Titanium SDK continuous integration builds.

| Argument | Description             | Type   | Default    |            |
| -------- | ----------------------- | ------ | ---------- | ---------- |
| `branch` | The branch to retreive. | String | `"master"` | _optional_ |

Returns `Promise<Object>`.

```js
const builds = await sdk.getBuilds('8_0_X');
console.log(builds);
```

```js
{
  ...
  '8.1.0.v20190307130759': {
    version: '8.1.0',
    ts: '20190307130759',
    githash: '60e97ceeb124a20fb374c8a4ed4c2b2b6983831c',
    date: 2019-03-07T13:07:59.000Z,
    url: 'http://builds.appcelerator.com/mobile/master/mobilesdk-8.1.0.v20190307130759-osx.zip'
  },
  ...
}
```

### `sdk.getInstalledSDKs([force])`

Detects installed Titanium SDKs.

| Argument | Description                                             | Type    | Default |            |
| -------- | ------------------------------------------------------- | ------- | ------- | ---------- |
| `force`  | When `true`, bypasses the cache and redetects the SDKs. | Boolean | `false` | _optional_ |

Returns `Array.<TitaniumSDK>`.

```js
const sdks = await sdk.getInstalledSDKs();
console.log(sdks);
```

```js
[
  TitaniumSDK {
    name: '8.0.0',
    manifest: {}
      name: '8.0.0',
        version: '8.0.0',
        moduleAPIVersion: {
          android: '4',
          iphone: '2',
          windows: '6'
       },
       githash: '9bcd36593d',
       platforms: [ 'android', 'iphone' ]
    },
    path: '/Users/USER/Library/Application Support/Titanium/mobilesdk/osx/8.0.0'
  }
]
```

### `sdk.getPaths()`

Returns a list of possible SDK install paths.

Returns `Array.<String>`.

```js
const paths = sdk.getPaths();
console.log(paths);
```

```js
[
  '/Users/USER/Library/Application Support/Titanium/mobilesdk/osx',
  '/Library/Application Support/Titanium/mobilesdk/osx'
]
```

### `sdk.getReleases([noLatest])`

Retreives a map of Titanium SDK versions to release info including the download URL. By default,
the latest version is added to the map of releases.

| Argument   | Description                                              | Type    | Default |            |
| ---------- | -------------------------------------------------------- | ------- | ------- | ---------- |
| `noLatest` | When `true`, it does not determine the 'latest' release. | Boolean | `false` | _optional_ |

Returns `Promise<Object>`.

```js
const releases = await sdk.getReleases();
console.log(releases);
```

```js
{
  '7.5.1.GA': {
    version: '7.5.1',
    url: 'https://builds.appcelerator.com/mobile-releases/7.5.1/mobilesdk-7.5.1.GA-osx.zip'
  },
  latest: {
    version: '7.5.1',
    url: 'https://builds.appcelerator.com/mobile-releases/7.5.1/mobilesdk-7.5.1.GA-osx.zip'
  }
}
```

### `sdk.install(params)`

Install a Titanium SDK from either a URI or version. A URI may be either a local file, a URL, an
SDK version, a CI branch, or a CI branch and build hash.

| Argument | Description         | Type   | Default |            |
| -------- | ------------------- | ------ | ------- | ---------- |
| `params` | Various parameters. | Object | `{}`    | _optional_ |

> Note: All parameters are optional.

| Property      | Description                                                                 | Type   | Default           |
| ------------- | --------------------------------------------------------------------------- | ------ | ----------------- |
| `downloadDir` | When `uri` is a URL, release, or build, download the SDK to this directory. | String | A temp directory. |
| `installDir`  | The path to install the SDK.  | String |       The first path in the list of Titanium install locations. |
| `keep`        | When `true` and `uri` is a URL, release, or build, and `downloadDir` is specified, then the downloaded SDK `.zip` file is not deleted after install. | Boolean | `false` |
| `overwrite`   | When `true`, overwrites an existing Titanium SDK installation, otherwise an error is thrown. Note that if `overwrite=false`, it will not throw an error if a module is already installed. | Boolean | `false` |
| `uri`         | A URI to a local file or remote URL to download. | String | `"latest"` |

Returns `Promise<String>`.

#### Install from local file

```js
await sdk.install({
    uri: 'file:///path/to/sdk.zip'
});
```

```js
await sdk.install({
    uri: '/path/to/sdk.zip'
});
```

#### Install from URL

```js
await sdk.install({
    uri: 'https://builds.appcelerator.com/mobile/master/mobilesdk-8.1.0.v20190307130759-osx.zip'
});
```

#### Install release

```js
await sdk.install({
    uri: '7.5.0.GA'
});
```

```js
await sdk.install({
    uri: '7.5.0'
});
```

```js
await sdk.install({
    uri: 'latest'
});
```

#### Install latest CI build by branch

```js
await sdk.install({
    uri: 'master'
});
```

#### Install specific CI build by branch and git hash

```js
await sdk.install({
    uri: 'master:60e97ceeb124a20fb374c8a4ed4c2b2b6983831c'
});
```

#### Install specific CI build by git hash

> Note: This is horribly inefficient. It checks every single branch for a match. You should
> probably never do this.

```js
await sdk.install({
    uri: '60e97ceeb124a20fb374c8a4ed4c2b2b6983831c'
});
```

### `sdk.uninstall(nameOrPath)`

Deletes an installed Titanium SDK by name or path.

| Argument | Description                            | Type   |
| -------- | -------------------------------------- | ------ |
| `nameOrPath` | The SDK name or path to uninstall. | String |

Returns `Promise<Array<TitaniumSDK>>`. If SDK is not found, an error is thrown with a `err.code` of `ENOTFOUND`.

```js
const sdk = await sdk.uninstall('7.5.1.GA');
console.log(sdk);
```

```js
[
  TitaniumSDK {
    name: '7.5.1.GA',
    manifest: {}
      name: '7.5.1.GA',
        version: '7.5.1',
        moduleAPIVersion: {
          android: '4',
          iphone: '2',
          windows: '6'
       },
       githash: '4b82d9d6b2',
       platforms: [ 'android', 'iphone' ]
    },
    path: '/Users/USER/Library/Application Support/Titanium/mobilesdk/osx/7.5.1.GA'
  }
]
```

## Modules

```js
import { modules } from 'titaniumlib';
```

### `modules.getInstalledModules([force])`

Detects installed Titanium modules.

| Argument | Description                                                | Type    | Default |            |
| -------- | ---------------------------------------------------------- | ------- | ------- | ---------- |
| `force`  | When `true`, bypasses the cache and redetects the modules. | Boolean | `false` | _optional_ |

Returns `Object` where `platform` > `module name` > `version` > `module info`.

```js
const mods = await modules.getInstalledModules();
console.log(mods);
```

```js
{
  "android": {
    "facebook": {
      "7.3.1": {
        "path": "/Users/USER/Library/Application Support/Titanium/modules/android/facebook/7.3.1",
        "platform": "android",
        "version": "7.3.1",
        "apiversion": 4,
        "architectures": "arm64-v8a armeabi-v7a x86",
        "description": "facebook",
        "author": "Mark Mokryn and Ashraf A. S. (Appcelerator)",
        "license": "Apache License Version 2.0",
        "copyright": "Copyright (c) 2014 by Mark Mokryn, Copyright (c) 2009-present by Appcelerator",
        "name": "Facebook",
        "moduleid": "facebook",
        "guid": "e4f7ac61-1ee7-44c5-bc27-fa6876e2dce9",
        "minsdk": "7.0.0"
      }
    }
  },
  "commonjs": {
    ...
  },
  "iphone": {
   ...
  },
  "windows": {
    ...
  }
}
```

### `modules.getPaths()`

Returns a list of possible Titanium module install paths.

Returns `Array.<String>`.

```js
const paths = modules.getPaths();
console.log(paths);
```

```js
[
  '/Users/USER/Library/Application Support/Titanium/modules',
  '/Library/Application Support/Titanium/modules'
]
```

## Project

Not available yet.

## License

This project is open source under the [Apache Public License v2][1] and is developed by
[Axway, Inc](http://www.axway.com/) and the community. Please read the [`LICENSE`][1] file included
in this distribution for more information.

[1]: https://github.com/appcelerator/titaniumlib/blob/master/LICENSE
