if ('undefined' === typeof FP_HOMEPAGE)
{
  (global as any).FP_HOMEPAGE = 'https://fluidplayer.com';
}

if ('undefined' === typeof FP_BUILD_VERSION)
{
  (global as any).FP_BUILD_VERSION = 'v3';
}

if ('undefined' === typeof FP_ENV)
{
  const isLocalhost = window
    && window.location
    && (window.location.hostname === 'localhost'
      || window.location.hostname === '127.0.0.1'
      || window.location.hostname === '');

  if (process && process.env && process.env.NODE_ENV)
  {
    (global as any).FP_ENV = process.env.NODE_ENV;
  }
  else if (window && !isLocalhost)
  {
    (global as any).FP_ENV = 'production';
  }
  else
  {
    (global as any).FP_ENV = 'development';
  }
}

if ('undefined' === typeof FP_DEBUG)
{
  (global as any).FP_DEBUG = false;
}

import './polyfills';
import wwPlayerInitializer from './wwplayer';

export default wwPlayerInitializer;
