import { WWPlayerModule } from '../types/display-options';

export const ModulesRegistry = {
    [WWPlayerModule.AdSupport]: () => import('./adsupport/adsupport').then(m => m.default),
    [WWPlayerModule.Cardboard]: () => import('./cardboard/cardboard').then(m => m.default),
    [WWPlayerModule.Streaming]: () => import('./streaming/streaming').then(m => m.default),
    [WWPlayerModule.Subtitles]: () => import('./subtitles/subtitles').then(m => m.default),
    [WWPlayerModule.Timeline] : () => import('./timeline/timeline').then(m => m.default),
    [WWPlayerModule.VAST]     : () => import('./vast/vast').then(m => m.default),
    [WWPlayerModule.VPAID]    : () => import('./vpaid/vpaid').then(m => m.default),
};
