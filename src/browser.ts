/**
 * Build entry point for CDN builds.
 * You SHOULD NOT import this file except if you plan to build browser distribution of WW Player.
 */

import wwPlayerInitializer from './index';

// Import CSS automatically in browser builds.
import './css/wwplayer.css';

if (window)
{
  /**
   * Register public interface.
   */
  if (!window['wwPlayer'])
  {
    window['wwPlayer'] = wwPlayerInitializer;
  }
}

