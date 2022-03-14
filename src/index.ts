if ('undefined' === typeof WWP_HOMEPAGE)
{
  (global as any).WWP_HOMEPAGE = 'https://wwplayer.com';
}

if ('undefined' === typeof WWP_BUILD_VERSION)
{
  (global as any).WWP_BUILD_VERSION = 'v3';
}

if ('undefined' === typeof WWP_ENV)
{
  const isLocalhost = window
    && window.location
    && (window.location.hostname === 'localhost'
      || window.location.hostname === '127.0.0.1'
      || window.location.hostname === '');

  if (process && process.env && process.env.NODE_ENV)
  {
    (global as any).WWP_ENV = process.env.NODE_ENV;
  }
  else if (window && !isLocalhost)
  {
    (global as any).WWP_ENV = 'production';
  }
  else
  {
    (global as any).WWP_ENV = 'development';
  }
}

if ('undefined' === typeof WWP_DEBUG)
{
  (global as any).WWP_DEBUG = false;
}

import './set-public-path';
import './polyfills';
import wwPlayerInitializer from './wwplayer';

export default wwPlayerInitializer;
