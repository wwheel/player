import Utils from './modules/utils/utils';
import CanAutoplay from './modules/can-autoplay/can-autoplay';
import { IDisplayOptions, ILogo, IVastOptions } from './types/display-options';
import { ICustomControlTags } from './types/custom-control-tags';
import { ICustomControlTagsOptions } from './types/custom-control-tags-options';
import { IPassedHtml } from './types/passed-html';
import { IWWPlayer } from './types/wwplayer';
import { ModulesRegistry } from './modules/registry';
import { IUtils } from './modules/utils/type';
import { ITimeline } from './modules/timeline/type';
import { IVast } from './modules/vast/type';
import { IVpaid } from './modules/vpaid/type';
import { ISubtitles } from './modules/subtitles/type';
import { IStreaming } from './modules/streaming/type';
import { ICardboard } from './modules/cardboard/type';
import { IAddSupport } from './modules/adsupport/type';
import { ICanAutoplay } from './modules/can-autoplay/types';

const WWP_MODULES = [
    Utils,
    CanAutoplay,
];

// Determine build mode
// noinspection JSUnresolvedVariable
const WWP_DEVELOPMENT_MODE = typeof WWP_ENV !== 'undefined' && WWP_ENV === 'development';

// Are we running in debug mode?
// noinspection JSUnresolvedVariable
const WWP_RUNTIME_DEBUG = typeof WWP_DEBUG !== 'undefined' && WWP_DEBUG === true;

let playerInstances = 0;

class Wwplayer
{
    version: string;
    homepage: string;
    destructors: any;
    domRef: {
        player: HTMLVideoElement;
        wrapper?: HTMLElement;
        controls?: ICustomControlTags;
    };
    vrROTATION_POSITION: number;
    vrROTATION_SPEED: number;
    vrMode: boolean;
    vrPanorama: any;
    vrViewer: any;
    vpaidTimer: any;
    vpaidAdUnit: any;
    fullscreenMode: boolean;
    vastOptions: IVastOptions;
    videoPlayerId: string;
    originalSrc: any;
    isCurrentlyPlayingAd: boolean;
    recentWaiting: boolean;
    latestVolume: number;
    currentVideoDuration: number;
    firstPlayLaunched: boolean;
    suppressClickthrough: boolean;
    timelinePreviewData: any[];
    mainVideoCurrentTime: number;
    mainVideoDuration: number;
    isTimer: boolean;
    timer: any;
    timerPool: {[key: string]: any};
    adList: {[key: string]: any};
    adPool: {[key: string]: any};
    adGroupedByRolls: {[key: string]: any};
    onPauseRollAdPods: any[];
    currentOnPauseRollAd: string;
    preRollAdsResolved: boolean;
    preRollAdPods: any[];
    preRollAdPodsLength: number;
    preRollVastResolved: number;
    temporaryAdPods: any[];
    availableRolls: string[];
    supportedNonLinearAd: string[];
    autoplayAfterAd: boolean;
    nonLinearDuration: number;
    supportedStaticTypes: string[];
    inactivityTimeout: any;
    isUserActive: any;
    nonLinearVerticalAlign: string;
    vpaidNonLinearCloseButton: boolean;
    showTimeOnHover: boolean;
    initialAnimationSet: boolean;
    theatreMode: boolean;
    theatreModeAdvanced: boolean;
    originalWidth: any;
    originalHeight: any;
    dashPlayer: any;
    hlsPlayer: any;
    dashScriptLoaded: boolean;
    hlsScriptLoaded: boolean;
    isPlayingMedia: boolean;
    isSwitchingSource: boolean;
    isLoading: boolean;
    isInIframe: any;
    mainVideoReadyState: boolean;
    xmlCollection: any[];
    inLineFound: any;
    wwStorage: {[key: string]: any};
    wwPseudoPause: boolean;
    mobileInfo: any;
    events: {};
    displayOptions: IDisplayOptions;
    captureKey: (event: any) => boolean;
    playbackRate: number;
    currentTime: number;
    newActivity: boolean;
    videoSources: {title: string; url: string; isHD: boolean}[];
    promiseTimeout: any;
    adFinished: boolean;

    getCanAutoplay(): Wwplayer&ICanAutoplay
    {
        return this;
    }

    getUtils(): Wwplayer&IUtils
    {
        return this;
    }

    getTimeline(): Wwplayer&ITimeline
    {
        return this;
    }

    getVAST(): Wwplayer&IVast
    {
        return this;
    }

    getVPAID(): Wwplayer&IVpaid
    {
        return this;
    }

    getSubtitles(): Wwplayer&ISubtitles
    {
        return this;
    }

    getStreaming(): Wwplayer&IStreaming
    {
        return this;
    }

    getCardboard(): Wwplayer&ICardboard
    {
        return this;
    }

    getAddSupport(): Wwplayer&IAddSupport
    {
        return this;
    }

    /**
     * Constructor
     */
    constructor()
    {
        this.domRef = {
            player: null
        };

        // noinspection JSUnresolvedVariable
        this.version     = typeof WWP_BUILD_VERSION !== 'undefined' ? WWP_BUILD_VERSION : '';
        // noinspection JSUnresolvedVariable
        this.homepage    = typeof WWP_HOMEPAGE !== 'undefined'
            ? WWP_HOMEPAGE + '/?utm_source=player&utm_medium=context_menu&utm_campaign=organic'
            : '';
        this.destructors = [];
    }

    async init(playerTarget: HTMLVideoElement|string|String, options: IDisplayOptions): Promise<void>
    {
        // Install player modules and features
        const moduleOptions = {
            development: WWP_DEVELOPMENT_MODE,
            debug      : WWP_RUNTIME_DEBUG,
        };

        if (Array.isArray(options.modules?.enabled))
        {
            for (const m of options.modules.enabled)
            {
                if (ModulesRegistry[m])
                {
                    const module = await ModulesRegistry[m]();
                    WWP_MODULES.push(module);
                }
            }
        }

        for (const playerModule of WWP_MODULES)
        {
            playerModule(this, moduleOptions);
        }

        // Check autoplay
        const autoplayResult = await this.getCanAutoplay().canAutoplay();
        if (!autoplayResult.result)
        {
            options.layoutControls.mute = true;
        }

        let playerNode;
        if (playerTarget instanceof HTMLVideoElement)
        {
            playerNode = playerTarget;

            // Automatically assign ID if none exists
            if (!playerTarget.id)
            {
                playerTarget.id = 'ww_player_instance_' + (playerInstances++).toString();
            }
        }
        else if (typeof playerTarget === 'string' || playerTarget instanceof String)
        {
            playerNode = document.getElementById(playerTarget as string);
        }
        else
        {
            throw 'Invalid initializer - player target must be HTMLVideoElement or ID';
        }

        if (!playerNode)
        {
            throw 'Could not find a HTML node to attach to for target ' + playerTarget + '"';
        }

        playerNode.setAttribute('playsinline', '');
        playerNode.setAttribute('webkit-playsinline', '');

        this.domRef.player       = playerNode;
        this.vrROTATION_POSITION = 0.1;
        this.vrROTATION_SPEED    = 80;
        this.vrMode              = false;
        this.vrPanorama          = null;
        this.vrViewer            = null;
        this.vpaidTimer          = null;
        this.vpaidAdUnit         = null;
        this.vastOptions         = null;
        /**
         * @deprecated Nothing should RELY on this. An internal ID generator
         * should be used where absolutely necessary and DOM objects under FP control
         * MUST be referenced in domRef.
         */
        this.videoPlayerId = playerNode.id;
        this.originalSrc               = this.getCurrentSrc();
        this.isCurrentlyPlayingAd      = false;
        this.recentWaiting             = false;
        this.latestVolume              = 1;
        this.currentVideoDuration      = 0;
        this.firstPlayLaunched         = false;
        this.suppressClickthrough      = false;
        this.timelinePreviewData       = [];
        this.mainVideoCurrentTime      = 0;
        this.mainVideoDuration         = 0;
        this.isTimer                   = false;
        this.timer                     = null;
        this.timerPool                 = {};
        this.adList                    = {};
        this.adPool                    = {};
        this.adGroupedByRolls          = {};
        this.onPauseRollAdPods         = [];
        this.currentOnPauseRollAd      = '';
        this.preRollAdsResolved        = false;
        this.preRollAdPods             = [];
        this.preRollAdPodsLength       = 0;
        this.preRollVastResolved       = 0;
        this.temporaryAdPods           = [];
        this.availableRolls            = ['preRoll', 'midRoll', 'postRoll', 'onPauseRoll'];
        this.supportedNonLinearAd      = ['300x250', '468x60', '728x90'];
        this.autoplayAfterAd           = true;
        this.nonLinearDuration         = 15;
        this.supportedStaticTypes      = ['image/gif', 'image/jpeg', 'image/png'];
        this.inactivityTimeout         = null;
        this.isUserActive              = null;
        this.nonLinearVerticalAlign    = 'bottom';
        this.vpaidNonLinearCloseButton = true;
        this.showTimeOnHover           = true;
        this.initialAnimationSet       = true;
        this.theatreMode               = false;
        this.theatreModeAdvanced       = false;
        this.fullscreenMode            = false;
        this.originalWidth             = playerNode.offsetWidth;
        this.originalHeight            = playerNode.offsetHeight;
        this.dashPlayer                = false;
        this.hlsPlayer                 = false;
        this.dashScriptLoaded          = false;
        this.hlsScriptLoaded           = false;
        this.isPlayingMedia            = false;
        this.isSwitchingSource         = false;
        this.isLoading                 = false;
        this.isInIframe                = this.inIframe();
        this.mainVideoReadyState       = false;
        this.xmlCollection             = [];
        this.inLineFound               = null;
        this.wwStorage                 = {};
        this.wwPseudoPause             = false;
        this.mobileInfo                = this.getUtils()?.getMobileOs();
        this.events                    = {};

        //Default options
        this.displayOptions = {
            layoutControls            : {
                mediaType             : this.getCurrentSrcType(),
                primaryColor          : false,
                posterImage           : false,
                posterImageSize       : 'contain',
                adProgressColor       : '#f9d300',
                playButtonShowing     : true,
                playPauseAnimation    : true,
                closeButtonCaption    : 'Close', // Remove?
                fillToContainer       : false,
                autoPlay              : false,
                preload               : 'auto',
                mute                  : false,
                loop                  : null,
                keyboardControl       : true,
                allowDownload         : false,
                playbackRateEnabled   : false,
                subtitlesEnabled      : false,
                showCardBoardView     : false,
                showCardBoardJoystick : false,
                allowTheatre          : true,
                doubleclickFullscreen : true,
                theatreSettings       : {
                    width          : '100%',
                    height         : '60%',
                    marginTop      : 0,
                    horizontalAlign: 'center',
                    keepPosition   : false
                },
                theatreAdvanced       : false,
                title                 : null,
                logo                  : {
                    imageUrl         : null,
                    position         : 'top left',
                    clickUrl         : null,
                    opacity          : 1,
                    mouseOverImageUrl: null,
                    imageMargin      : '2px',
                    hideWithControls : false,
                    showOverAds      : false
                },
                controlBar            : {
                    autoHide       : false,
                    autoHideTimeout: 3,
                    animated       : true
                },
                timelinePreview       : {
                    spriteImage       : false,
                    spriteRelativePath: false
                },
                htmlOnPauseBlock      : {
                    html  : null,
                    height: null,
                    width : null
                },
                layout                : 'default', //options: 'default', '<custom>'
                playerInitCallback    : (function ()
                {
                }),
                persistentSettings    : {
                    volume : true,
                    quality: true,
                    speed  : true,
                    theatre: true
                },
                controlForwardBackward: {
                    show: false
                },
                contextMenu           : {
                    controls: true,
                    links   : []
                },
            },
            vastOptions               : {
                adList                    : {},
                skipButtonCaption         : 'Skip ad in [seconds]',
                skipButtonClickCaption    : 'Skip Ad <span class="skip_button_icon"></span>',
                adText                    : null,
                adTextPosition            : 'top left',
                adCTAText                 : 'Visit now!',
                adCTATextPosition         : 'bottom right',
                adClickable               : true,
                vastTimeout               : 5000,
                showProgressbarMarkers    : false,
                allowVPAID                : false,
                showPlayButton            : false,
                maxAllowedVastTagRedirects: 3,
                vpaidTimeout              : 3000,

                vastAdvanced: {
                    vastLoadedCallback      : (function ()
                    {
                    }),
                    noVastVideoCallback     : (function ()
                    {
                    }),
                    vastVideoSkippedCallback: (function ()
                    {
                    }),
                    vastVideoEndedCallback  : (function ()
                    {
                    })
                }
            },
            captions                  : {
                play          : 'Play',
                pause         : 'Pause',
                mute          : 'Mute',
                unmute        : 'Unmute',
                fullscreen    : 'Fullscreen',
                subtitles     : 'Subtitles',
                exitFullscreen: 'Exit Fullscreen',
            },
            debug                     : WWP_RUNTIME_DEBUG,
            modules                   : {
                configureHls    : (options) =>
                {
                    return options;
                },
                onBeforeInitHls : (hls) =>
                {
                },
                onAfterInitHls  : (hls) =>
                {
                },
                configureDash   : (options) =>
                {
                    return options;
                },
                onBeforeInitDash: (dash) =>
                {
                },
                onAfterInitDash : (dash) =>
                {
                },
                onAfterAllModulesInit: () =>
                {
                }
            },
            onBeforeXMLHttpRequestOpen: (request) =>
            {
            },
            onBeforeXMLHttpRequest    : (request) =>
            {
                if (WWP_RUNTIME_DEBUG || WWP_DEVELOPMENT_MODE)
                {
                    console.debug('[WWP_DEBUG] Request made', request);
                }
            },
        };

        // Overriding the default options
        for (let key in options)
        {
            if (!options.hasOwnProperty(key))
            {
                continue;
            }
            if (typeof options[key] == 'object')
            {
                for (let subKey in options[key])
                {
                    if (!options[key].hasOwnProperty(subKey))
                    {
                        continue;
                    }
                    this.displayOptions[key][subKey] = options[key][subKey];
                }
            }
            else
            {
                this.displayOptions[key] = options[key];
            }
        }

        this.domRef.wrapper = this.setupPlayerWrapper();

        if (this.getVAST()?.recalculateAdDimensions)
        {
            playerNode.addEventListener('webkitfullscreenchange', this.getVAST().recalculateAdDimensions.bind(this));
            playerNode.addEventListener('fullscreenchange', this.getVAST().recalculateAdDimensions.bind(this));
        }
        playerNode.addEventListener('waiting', this.onRecentWaiting.bind(this));
        playerNode.addEventListener('pause', this.onWWPlayerPause.bind(this));
        playerNode.addEventListener('loadedmetadata', this.mainVideoReady.bind(this));
        playerNode.addEventListener('error', this.onErrorDetection.bind(this));
        playerNode.addEventListener('ended', this.onMainVideoEnded.bind(this));
        playerNode.addEventListener('durationchange', () =>
        {
            this.currentVideoDuration = this.getCurrentVideoDuration();
        });

        if (this.displayOptions.layoutControls.showCardBoardView)
        {
            // This fixes cross origin errors on three.js
            playerNode.setAttribute('crossOrigin', 'anonymous');
        }

        //Manually load the video duration if the video was loaded before adding the event listener
        this.currentVideoDuration = this.getCurrentVideoDuration();

        if (isNaN(this.currentVideoDuration) || !isFinite(this.currentVideoDuration))
        {
            this.currentVideoDuration = 0;
        }

        this.setLayout();

        //Set the volume control state
        this.latestVolume = playerNode.volume;

        // Set the default animation setting
        this.initialAnimationSet = this.displayOptions.layoutControls.playPauseAnimation;

        //Set the custom fullscreen behaviour
        this.handleFullscreen();

        this.initLogo();

        this.initTitle();

        this.initMute();

        this.initLoop();

        this.displayOptions.layoutControls.playerInitCallback();

        this.createVideoSourceSwitch();

        if (this.getSubtitles()?.createSubtitles)
        {
            this.getSubtitles().createSubtitles();
        }

        if (this.getCardboard()?.createCardboard)
        {
            this.getCardboard().createCardboard();
        }

        this.userActivityChecker();

        if (this.getVAST()?.setVastList)
        {
            this.getVAST().setVastList();
        }

        this.setPersistentSettings();

        // DO NOT initialize streamers if there are pre-rolls. It will break the streamers!
        // Streamers will re-initialize once ad has been shown.
        const preRolls = this.findRoll('preRoll');
        const notRolls = !preRolls || 0 === preRolls.length;
        if (notRolls && this.getStreaming()?.initialiseStreamers)
        {
            await this.getStreaming().initialiseStreamers();
        }

        const _play_videoPlayer = playerNode.play;

        const self = this;

        playerNode.play = function ()
        {
            let promise = null;

            if (self.displayOptions.layoutControls.showCardBoardView)
            {
                if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function')
                {
                    (DeviceOrientationEvent as any).requestPermission()
                        .then(function (response)
                        {
                            if (response === 'granted')
                            {
                                self.debugMessage('DeviceOrientationEvent permission granted!');
                            }
                        })
                        .catch(console.error);
                }
            }

            try
            {
                promise = _play_videoPlayer.apply(this, arguments);

                if (promise !== undefined && promise !== null)
                {
                    promise.then(() =>
                    {
                        self.isPlayingMedia = true;
                        clearTimeout(self.promiseTimeout);
                    }).catch(error =>
                    {
                        console.log('muted', self.domRef.player.muted);
                        console.error('[WWP_ERROR] Playback error', error);
                        const isAbortError = (typeof error.name !== 'undefined' && error.name === 'AbortError');
                        // Ignore abort errors which caused for example Safari or autoplay functions
                        // (example: interrupted by a new load request)
                        // (example: interrupted by a new load request)
                        if (isAbortError)
                        {
                            // Ignore AbortError error reporting
                        }
                        else
                        {
                            self.announceLocalError(202, 'Failed to play video.');
                        }

                        clearTimeout(self.promiseTimeout);
                    });

                    self.promiseTimeout = setTimeout(function ()
                    {
                        if (self.isPlayingMedia === false)
                        {
                            self.announceLocalError(204, '[WWP_ERROR] Timeout error. Failed to play video?');
                        }
                    }, 5000);

                }

                return promise;
            }
            catch (error)
            {
                console.error('[WWP_ERROR] Playback error', error);
                self.announceLocalError(201, 'Failed to play video.');
            }
        };

        const videoPauseOriginal = playerNode.pause;
        playerNode.pause         = function ()
        {
            if (self.isPlayingMedia === true)
            {
                self.isPlayingMedia = false;
                return videoPauseOriginal.apply(this, arguments);
            }

            // just in case
            if (self.isCurrentlyPlayingVideo(self.domRef.player))
            {
                try
                {
                    self.isPlayingMedia = false;
                    return videoPauseOriginal.apply(this, arguments);
                }
                catch (e)
                {
                    self.announceLocalError(203, 'Failed to play video.');
                }
            }
        };

        console.log({
            autoPlay: this.displayOptions.layoutControls.autoPlay,
            dashScriptLoaded: this.dashScriptLoaded,
            hlsScriptLoaded: this.hlsScriptLoaded
        });

        if (!!this.displayOptions.layoutControls.autoPlay && !this.dashScriptLoaded && !this.hlsScriptLoaded)
        {
            //There is known issue with Safari 11+, will prevent autoPlay, so we wont try
            const browserVersion = this.getUtils().getBrowserVersion();

            if ('Safari' === browserVersion.browserName)
            {
                return;
            }

            playerNode.play();
        }

        const videoWrapper = document.getElementById('ww_video_wrapper_' + playerNode.id);

        if (!this.mobileInfo.userOs)
        {
            videoWrapper.addEventListener('mouseleave', this.handleMouseleave.bind(this), false);
            videoWrapper.addEventListener('mouseenter', this.showControlBar.bind(this), false);
            videoWrapper.addEventListener('mouseenter', this.showTitle.bind(this), false);
        }
        else
        {
            //On mobile mouseleave behavior does not make sense, so it's better to keep controls, once the playback starts
            //Autohide behavior on timer is a separate functionality
            this.hideControlBar();
            videoWrapper.addEventListener('touchstart', this.showControlBar.bind(this), false);
        }

        //Keyboard Controls
        if (this.displayOptions.layoutControls.keyboardControl)
        {
            this.keyboardControl();
        }

        if (this.displayOptions.layoutControls.controlBar.autoHide)
        {
            this.linkControlBarUserActivity();
        }

        // Hide the captions on init if user added subtitles track.
        // We are taking captions track kind of as metadata
        try
        {
            if (!!this.domRef.player.textTracks)
            {
                for (let i = 0, L = this.domRef.player.textTracks.length; i < L; i++)
                {
                    this.domRef.player.textTracks[i].mode = 'hidden';
                }
            }
        }
        catch (_ignored)
        {
        }

        this.displayOptions.modules.onAfterAllModulesInit();
    }

    getCurrentVideoDuration(): number
    {
        if (this.domRef.player)
        {
            return this.domRef.player.duration;
        }
        return 0;
    }

    toggleLoader(showLoader: boolean): void
    {
        this.isLoading = !!showLoader;

        const loaderDiv = document.getElementById('vast_video_loading_' + this.videoPlayerId);

        loaderDiv.style.display = showLoader ? 'table' : 'none';
    }

    sendRequest(url: string, withCredentials?: boolean, timeout?: number, functionReadyStateChange?: ((this: XMLHttpRequest, ev: Event) => any)|null): void
    {
        const xmlHttpReq = new XMLHttpRequest();

        xmlHttpReq.onreadystatechange = functionReadyStateChange;

        this.displayOptions.onBeforeXMLHttpRequestOpen(xmlHttpReq);

        xmlHttpReq.open('GET', url, true);
        xmlHttpReq.withCredentials = withCredentials;
        xmlHttpReq.timeout         = timeout;

        this.displayOptions.onBeforeXMLHttpRequest(xmlHttpReq);

        xmlHttpReq.send();
    }

    announceLocalError(code: string|number, msg?: string): void
    {
        const parsedCode = typeof (code) !== 'undefined' ? Number(code) : 900;
        let message      = '[Error] (' + parsedCode + '): ';
        message += !msg ? 'Failed to load Vast' : msg;
        console.warn(message);
    }

    debugMessage(msg: string): void
    {
        if (this.displayOptions.debug)
        {
            console.log(msg);
        }
    }

    onMainVideoEnded(event): void
    {
        this.debugMessage('onMainVideoEnded is called');

        if (this.isCurrentlyPlayingAd && this.autoplayAfterAd)
        {  // It may be in-stream ending, and if it's not postroll then we don't execute anything
            return;
        }

        //we can remove timer as no more ad will be shown
        if (Math.floor(this.getCurrentTime()) >= Math.floor(this.mainVideoDuration))
        {

            // play pre-roll ad
            // sometime pre-roll ad will be missed because we are clearing the timer
            if (this.getAddSupport()?.adKeytimePlay)
            {
                this.getAddSupport().adKeytimePlay(Math.floor(this.mainVideoDuration));
            }

            clearInterval(this.timer);
        }

        if (!!this.displayOptions.layoutControls.loop)
        {
            if (this.getAddSupport()?.switchToMainVideo)
            {
                this.getAddSupport().switchToMainVideo();
            }
            this.playPauseToggle();
        }
    }

    getCurrentTime(): number
    {
        return this.isCurrentlyPlayingAd
            ? this.mainVideoCurrentTime
            : this.domRef.player.currentTime;
    }

    /**
     * Gets the src value of the first source element of the video tag.
     */
    getCurrentSrc(): string|null
    {
        const sources = this.domRef.player.getElementsByTagName('source');

        if (sources.length)
        {
            return sources[0].getAttribute('src');
        }

        return null;
    }

    /**
     * Src types required for streaming elements
     */
    getCurrentSrcType(): string|null
    {
        const sources = this.domRef.player.getElementsByTagName('source');

        if (!sources.length)
        {
            return null;
        }

        for (let i = 0; i < sources.length; i++)
        {
            if (sources[i].getAttribute('src') === this.originalSrc)
            {
                return sources[i].getAttribute('type').toLowerCase();
            }
        }

        return null;
    }

    onRecentWaiting(): void
    {
        this.recentWaiting = true;

        setTimeout(() =>
        {
            this.recentWaiting = false;
        }, 1000);
    }

    /**
     * Dispatches a custom pause event which is not present when seeking.
     */
    onWWPlayerPause(): void
    {
        setTimeout(() =>
        {
            if (this.recentWaiting)
            {
                return;
            }

            const event = document.createEvent('CustomEvent');
            event.initEvent('wwplayerpause', false, true);
            this.domRef.player.dispatchEvent(event);
        }, 100);
    }

    checkShouldDisplayVolumeBar(): boolean
    {
        return 'iOS' !== this.getUtils().getMobileOs().userOs;
    }

    generateCustomControlTags(options: ICustomControlTagsOptions): ICustomControlTags
    {
        const controls: ICustomControlTags = {};

        // Loader
        controls.loader               = document.createElement('div');
        controls.loader.className     = 'vast_video_loading';
        controls.loader.id            = 'vast_video_loading_' + this.videoPlayerId;
        controls.loader.style.display = 'none';

        // Root element
        controls.root           = document.createElement('div');
        controls.root.className = 'ww_controls_container';
        controls.root.id        = this.videoPlayerId + '_ww_controls_container';

        if (!options.displayVolumeBar)
        {
            controls.root.className = controls.root.className + ' no_volume_bar';
        }

        if (options.controlForwardBackward)
        {
            controls.root.className = controls.root.className + ' skip_controls';
        }

        // Left container
        controls.leftContainer           = document.createElement('div');
        controls.leftContainer.className = 'ww_controls_left';
        controls.root.appendChild(controls.leftContainer);

        // Left container -> Play/Pause
        controls.playPause           = document.createElement('div');
        controls.playPause.className = 'ww_button ww_button_play ww_control_playpause';
        controls.playPause.id        = this.videoPlayerId + '_ww_control_playpause';
        controls.leftContainer.appendChild(controls.playPause);

        if (options.controlForwardBackward)
        {
            // Left container -> Skip backwards
            controls.skipBack           = document.createElement('div');
            controls.skipBack.className = 'ww_button ww_button_skip_back';
            controls.skipBack.id        = this.videoPlayerId + '_ww_control_skip_back';
            controls.leftContainer.appendChild(controls.skipBack);

            // Left container -> Skip forward
            controls.skipForward           = document.createElement('div');
            controls.skipForward.className = 'ww_button ww_button_skip_forward';
            controls.skipForward.id        = this.videoPlayerId + '_ww_control_skip_forward';
            controls.leftContainer.appendChild(controls.skipForward);
        }

        // Progress container
        controls.progressContainer           = document.createElement('div');
        controls.progressContainer.className = 'ww_controls_progress_container ww_slider';
        controls.progressContainer.id        = this.videoPlayerId + '_ww_controls_progress_container';
        controls.root.appendChild(controls.progressContainer);

        // Progress container -> Progress wrapper
        controls.progressWrapper           = document.createElement('div');
        controls.progressWrapper.className = 'ww_controls_progress';
        controls.progressContainer.appendChild(controls.progressWrapper);

        // Progress container -> Progress wrapper -> Current progress
        controls.progressCurrent                       = document.createElement('div');
        controls.progressCurrent.className             = 'ww_controls_currentprogress';
        controls.progressCurrent.id                    = this.videoPlayerId + '_vast_control_currentprogress';
        controls.progressCurrent.style.backgroundColor = options.primaryColor as string;
        controls.progressWrapper.appendChild(controls.progressCurrent);

        // Progress container -> Progress wrapper -> Current progress -> Marker
        controls.progress_current_marker           = document.createElement('div');
        controls.progress_current_marker.className = 'ww_controls_currentpos';
        controls.progress_current_marker.id        = this.videoPlayerId + '_vast_control_currentpos';
        controls.progressCurrent.appendChild(controls.progress_current_marker);

        // Progress container -> Buffered indicator
        controls.bufferedIndicator           = document.createElement('div');
        controls.bufferedIndicator.className = 'ww_controls_buffered';
        controls.bufferedIndicator.id        = this.videoPlayerId + '_buffered_amount';
        controls.progressContainer.appendChild(controls.bufferedIndicator);

        // Progress container -> Ad markers
        controls.adMarkers           = document.createElement('div');
        controls.adMarkers.className = 'ww_controls_ad_markers_holder';
        controls.adMarkers.id        = this.videoPlayerId + '_ad_markers_holder';
        controls.progressContainer.appendChild(controls.adMarkers);

        // Right container
        controls.rightContainer           = document.createElement('div');
        controls.rightContainer.className = 'ww_controls_right';
        controls.root.appendChild(controls.rightContainer);

        // Right container -> Fullscreen
        controls.fullscreen           = document.createElement('div');
        controls.fullscreen.id        = this.videoPlayerId + '_ww_control_fullscreen';
        controls.fullscreen.className = 'ww_button ww_control_fullscreen ww_button_fullscreen';
        controls.rightContainer.appendChild(controls.fullscreen);

        // Right container -> Theatre
        controls.theatre           = document.createElement('div');
        controls.theatre.id        = this.videoPlayerId + '_ww_control_theatre';
        controls.theatre.className = 'ww_button ww_control_theatre ww_button_theatre';
        controls.rightContainer.appendChild(controls.theatre);

        // Right container -> Cardboard
        controls.cardboard           = document.createElement('div');
        controls.cardboard.id        = this.videoPlayerId + '_ww_control_cardboard';
        controls.cardboard.className = 'ww_button ww_control_cardboard ww_button_cardboard';
        controls.rightContainer.appendChild(controls.cardboard);

        // Right container -> Subtitles
        controls.subtitles           = document.createElement('div');
        controls.subtitles.id        = this.videoPlayerId + '_ww_control_subtitles';
        controls.subtitles.className = 'ww_button ww_button_subtitles';
        controls.rightContainer.appendChild(controls.subtitles);

        // Right container -> Video source
        controls.videoSource           = document.createElement('div');
        controls.videoSource.id        = this.videoPlayerId + '_ww_control_video_source';
        controls.videoSource.className = 'ww_button ww_button_video_source';
        controls.rightContainer.appendChild(controls.videoSource);

        // Right container -> Playback rate
        controls.playbackRate           = document.createElement('div');
        controls.playbackRate.id        = this.videoPlayerId + '_ww_control_playback_rate';
        controls.playbackRate.className = 'ww_button ww_button_playback_rate';
        controls.rightContainer.appendChild(controls.playbackRate);

        // Right container -> Download
        controls.download           = document.createElement('div');
        controls.download.id        = this.videoPlayerId + '_ww_control_download';
        controls.download.className = 'ww_button ww_button_download';
        controls.rightContainer.appendChild(controls.download);

        // Right container -> Volume container
        controls.volumeContainer           = document.createElement('div');
        controls.volumeContainer.id        = this.videoPlayerId + '_ww_control_volume_container';
        controls.volumeContainer.className = 'ww_control_volume_container ww_slider';
        controls.rightContainer.appendChild(controls.volumeContainer);

        // Right container -> Volume container -> Volume
        controls.volume           = document.createElement('div');
        controls.volume.id        = this.videoPlayerId + '_ww_control_volume';
        controls.volume.className = 'ww_control_volume';
        controls.volumeContainer.appendChild(controls.volume);

        // Right container -> Volume container -> Volume -> Current
        controls.volumeCurrent           = document.createElement('div');
        controls.volumeCurrent.id        = this.videoPlayerId + '_ww_control_currentvolume';
        controls.volumeCurrent.className = 'ww_control_currentvolume';
        controls.volume.appendChild(controls.volumeCurrent);

        // Right container -> Volume container -> Volume -> Current -> position
        controls.volumeCurrentPos           = document.createElement('div');
        controls.volumeCurrentPos.id        = this.videoPlayerId + '_ww_control_volume_currentpos';
        controls.volumeCurrentPos.className = 'ww_control_volume_currentpos';
        controls.volumeCurrent.appendChild(controls.volumeCurrentPos);

        // Right container -> Volume container
        controls.mute           = document.createElement('div');
        controls.mute.id        = this.videoPlayerId + '_ww_control_mute';
        controls.mute.className = 'ww_button ww_button_volume ww_control_mute';
        controls.rightContainer.appendChild(controls.mute);

        // Right container -> Volume container
        controls.duration           = document.createElement('div');
        controls.duration.id        = this.videoPlayerId + '_ww_control_duration';
        controls.duration.className = 'ww_control_duration ww_ww_control_duration';
        controls.duration.innerText = '00:00 / 00:00';
        controls.rightContainer.appendChild(controls.duration);

        return controls;
    }

    controlPlayPauseToggle(id?: string): void
    {
        const playPauseButton = (this.domRef.player.parentNode as HTMLElement).getElementsByClassName('ww_control_playpause');
        const menuOptionPlay  = document.getElementById(this.videoPlayerId + 'context_option_play');
        const controlsDisplay = (this.domRef.player.parentNode as HTMLElement).getElementsByClassName('ww_controls_container');
        const fpLogo          = document.getElementById(this.videoPlayerId + '_logo');

        const initialPlay = document.getElementById(this.videoPlayerId + '_ww_initial_play');
        if (initialPlay)
        {
            document.getElementById(this.videoPlayerId + '_ww_initial_play').style.display        = 'none';
            document.getElementById(this.videoPlayerId + '_ww_initial_play_button').style.opacity = '1';
        }

        if (!this.domRef.player.paused)
        {
            for (let i = 0; i < playPauseButton.length; i++)
            {
                playPauseButton[i].className = playPauseButton[i].className.replace(/\bww_button_play\b/g, 'ww_button_pause');
            }

            for (let i = 0; i < controlsDisplay.length; i++)
            {
                controlsDisplay[i].classList.remove('initial_controls_show');
            }

            if (fpLogo)
            {
                fpLogo.classList.remove('initial_controls_show');
            }

            if (menuOptionPlay !== null)
            {
                menuOptionPlay.innerHTML = this.displayOptions.captions.pause;
            }

            return;
        }

        for (let i = 0; i < playPauseButton.length; i++)
        {
            playPauseButton[i].className = playPauseButton[i].className.replace(/\bww_button_pause\b/g, 'ww_button_play');
        }

        for (let i = 0; i < controlsDisplay.length; i++)
        {
            controlsDisplay[i].classList.add('initial_controls_show');
        }

        if (this.isCurrentlyPlayingAd && this.displayOptions.vastOptions.showPlayButton)
        {
            document.getElementById(this.videoPlayerId + '_ww_initial_play').style.display        = 'block';
            document.getElementById(this.videoPlayerId + '_ww_initial_play_button').style.opacity = '1';
        }

        if (fpLogo)
        {
            fpLogo.classList.add('initial_controls_show');
        }

        if (menuOptionPlay !== null)
        {
            menuOptionPlay.innerHTML = this.displayOptions.captions.play;
        }
    }

    playPauseAnimationToggle(play): void
    {
        if (this.isCurrentlyPlayingAd || !this.displayOptions.layoutControls.playPauseAnimation || this.isSwitchingSource)
        {
            return;
        }

        if (play)
        {
            document.getElementById(this.videoPlayerId + '_ww_state_button').classList
                .remove('ww_initial_pause_button');
            document.getElementById(this.videoPlayerId + '_ww_state_button').classList
                .add('ww_initial_play_button');
        }
        else
        {
            document.getElementById(this.videoPlayerId + '_ww_state_button').classList
                .remove('ww_initial_play_button');
            document.getElementById(this.videoPlayerId + '_ww_state_button').classList
                .add('ww_initial_pause_button');
        }

        document.getElementById(this.videoPlayerId + '_ww_initial_play').classList.add('transform-active');
        setTimeout(
            () =>
            {
                document.getElementById(this.videoPlayerId + '_ww_initial_play').classList
                    .remove('transform-active');
            },
            800
        );
    }

    contolProgressbarUpdate(id?: any): void
    {
        const currentProgressTag = (this.domRef.player.parentNode as HTMLElement).getElementsByClassName('ww_controls_currentprogress');

        for (let i = 0; i < currentProgressTag.length; i++)
        {
            (currentProgressTag[i] as HTMLElement).style.width = (this.domRef.player.currentTime / this.currentVideoDuration * 100) + '%';
        }
    }

    controlDurationUpdate(id?: any): void
    {
        const currentPlayTime = this.getUtils().formatTime(this.domRef.player.currentTime);

        let isLiveHls = false;
        if (this.hlsPlayer)
        {
            isLiveHls = this.hlsPlayer.levels &&
                this.hlsPlayer.levels[this.hlsPlayer.currentLevel] &&
                this.hlsPlayer.levels[this.hlsPlayer.currentLevel].details.live;
        }

        let durationText;
        if (isNaN(this.currentVideoDuration) || !isFinite(this.currentVideoDuration) || isLiveHls)
        {
            durationText = currentPlayTime;
        }
        else
        {
            const totalTime = this.getUtils().formatTime(this.currentVideoDuration);
            durationText    = currentPlayTime + ' / ' + totalTime;
        }

        const timePlaceholder = (this.domRef.player.parentNode as HTMLElement).getElementsByClassName('ww_control_duration');

        for (let i = 0; i < timePlaceholder.length; i++)
        {
            timePlaceholder[i].innerHTML = durationText;
        }
    }

    contolVolumebarUpdate(playerId?: string): void
    {
        const currentVolumeTag    = document.getElementById(this.videoPlayerId + '_ww_control_currentvolume');
        const volumeposTag        = document.getElementById(this.videoPlayerId + '_ww_control_volume_currentpos');
        const volumebarTotalWidth = document.getElementById(this.videoPlayerId + '_ww_control_volume').clientWidth;
        const volumeposTagWidth   = volumeposTag.clientWidth;
        const muteButtonTag       = (this.domRef.player.parentNode as HTMLElement).getElementsByClassName('ww_control_mute');
        const menuOptionMute      = document.getElementById(this.videoPlayerId + 'context_option_mute');

        if (0 !== this.domRef.player.volume)
        {
            this.latestVolume     = this.domRef.player.volume;
            this.wwStorage.wwMute = false;
        }
        else
        {
            this.wwStorage.wwMute = true;
        }

        if (this.domRef.player.volume && !this.domRef.player.muted)
        {
            for (let i = 0; i < muteButtonTag.length; i++)
            {
                muteButtonTag[i].className = muteButtonTag[i].className.replace(/\bww_button_mute\b/g, 'ww_button_volume');
            }

            if (menuOptionMute !== null)
            {
                menuOptionMute.innerHTML = this.displayOptions.captions.mute;
            }

        }
        else
        {
            for (let i = 0; i < muteButtonTag.length; i++)
            {
                muteButtonTag[i].className = muteButtonTag[i].className.replace(/\bww_button_volume\b/g, 'ww_button_mute');
            }

            if (menuOptionMute !== null)
            {
                menuOptionMute.innerHTML = this.displayOptions.captions.unmute;
            }
        }
        currentVolumeTag.style.width = (this.domRef.player.volume * volumebarTotalWidth) + 'px';
        volumeposTag.style.left      = (this.domRef.player.volume * volumebarTotalWidth - (volumeposTagWidth / 2)) + 'px';
    }

    muteToggle(): void
    {
        if (0 !== this.domRef.player.volume && !this.domRef.player.muted)
        {
            this.domRef.player.volume = 0;
            this.domRef.player.muted  = true;
        }
        else
        {
            this.domRef.player.volume = this.latestVolume;
            this.domRef.player.muted  = false;
        }

        // Persistent settings
        this.wwStorage.wwVolume = this.latestVolume;
        this.wwStorage.wwMute   = this.domRef.player.muted;
    }

    checkFullscreenSupport(videoPlayerWrapperId: string): {
        goFullscreen: string;
        exitFullscreen: string;
        isFullscreen: string;
    }|boolean
    {
        const videoPlayerWrapper = document.getElementById(videoPlayerWrapperId) as HTMLElement;

        if (videoPlayerWrapper['mozRequestFullScreen'])
        {
            return {
                goFullscreen  : 'mozRequestFullScreen',
                exitFullscreen: 'mozCancelFullScreen',
                isFullscreen  : 'mozFullScreenElement'
            };

        }
        else if (videoPlayerWrapper['webkitRequestFullscreen'])
        {
            return {
                goFullscreen  : 'webkitRequestFullscreen',
                exitFullscreen: 'webkitExitFullscreen',
                isFullscreen  : 'webkitFullscreenElement'
            };

        }
        else if (videoPlayerWrapper['msRequestFullscreen'])
        {
            return {
                goFullscreen  : 'msRequestFullscreen',
                exitFullscreen: 'msExitFullscreen',
                isFullscreen  : 'msFullscreenElement'
            };

        }
        else if (videoPlayerWrapper.requestFullscreen)
        {
            return {
                goFullscreen  : 'requestFullscreen',
                exitFullscreen: 'exitFullscreen',
                isFullscreen  : 'fullscreenElement'
            };

        }
        else if (this.domRef.player['webkitSupportsFullscreen'])
        {
            return {
                goFullscreen  : 'webkitEnterFullscreen',
                exitFullscreen: 'webkitExitFullscreen',
                isFullscreen  : 'webkitDisplayingFullscreen'
            };
        }

        return false;
    }

    fullscreenOff(fullscreenButton, menuOptionFullscreen): void
    {
        for (let i = 0; i < fullscreenButton.length; i++)
        {
            fullscreenButton[i].className = fullscreenButton[i].className.replace(/\bww_button_fullscreen_exit\b/g, 'ww_button_fullscreen');
        }
        if (menuOptionFullscreen !== null)
        {
            menuOptionFullscreen.innerHTML = 'Fullscreen';
        }
        this.fullscreenMode = false;
    }

    fullscreenOn(fullscreenButton, menuOptionFullscreen): void
    {
        for (let i = 0; i < fullscreenButton.length; i++)
        {
            fullscreenButton[i].className = fullscreenButton[i].className.replace(/\bww_button_fullscreen\b/g, 'ww_button_fullscreen_exit');
        }

        if (menuOptionFullscreen !== null)
        {
            menuOptionFullscreen.innerHTML = this.displayOptions.captions.exitFullscreen;
        }
        this.fullscreenMode = true;
    }

    fullscreenToggle(state?: any): void
    {
        const videoPlayerTag                 = this.domRef.player;
        const fullscreenTag                  = document.getElementById('ww_video_wrapper_' + this.videoPlayerId);
        const requestFullscreenFunctionNames = this.checkFullscreenSupport('ww_video_wrapper_' + this.videoPlayerId);
        const fullscreenButton               = (videoPlayerTag.parentNode as HTMLElement).getElementsByClassName('ww_control_fullscreen');
        const menuOptionFullscreen           = document.getElementById(this.videoPlayerId + 'context_option_fullscreen');

        // Disable Theatre mode if it's on while we toggle fullscreen
        if (this.theatreMode)
        {
            this.theatreToggle();
        }

        let functionNameToExecute;

        if (requestFullscreenFunctionNames)
        {
            // iOS fullscreen elements are different and so need to be treated separately
            if ((requestFullscreenFunctionNames as any).goFullscreen === 'webkitEnterFullscreen')
            {
                if (!videoPlayerTag[(requestFullscreenFunctionNames as any).isFullscreen])
                {
                    functionNameToExecute = 'videoPlayerTag.' + (requestFullscreenFunctionNames as any).goFullscreen + '();';
                    this.fullscreenOn(fullscreenButton, menuOptionFullscreen);
                    new Function('videoPlayerTag', functionNameToExecute)(videoPlayerTag);
                }
            }
            else
            {
                if (document[(requestFullscreenFunctionNames as any).isFullscreen] === null)
                {
                    //Go fullscreen
                    functionNameToExecute = 'videoPlayerTag.' + (requestFullscreenFunctionNames as any).goFullscreen + '();';
                    this.fullscreenOn(fullscreenButton, menuOptionFullscreen);
                }
                else
                {
                    //Exit fullscreen
                    functionNameToExecute = 'document.' + (requestFullscreenFunctionNames as any).exitFullscreen + '();';
                    this.fullscreenOff(fullscreenButton, menuOptionFullscreen);
                }
                new Function('videoPlayerTag', functionNameToExecute)(fullscreenTag);
            }
        }
        else
        {
            //The browser does not support the Fullscreen API, so a pseudo-fullscreen implementation is used
            if (fullscreenTag.className.search(/\bpseudo_fullscreen\b/g) !== -1)
            {
                fullscreenTag.className = fullscreenTag.className.replace(/\bpseudo_fullscreen\b/g, '');
                this.fullscreenOff(fullscreenButton, menuOptionFullscreen);
            }
            else
            {
                fullscreenTag.className += ' pseudo_fullscreen';
                this.fullscreenOn(fullscreenButton, menuOptionFullscreen);
            }
        }

        if (this.getVPAID()?.resizeVpaidAuto)
        {
            this.getVPAID().resizeVpaidAuto();
        }
    }

    findClosestParent(el: HTMLElement, selector: string): HTMLElement|null
    {
        let matchesFn = null;

        // find vendor prefix
        ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function (fn)
        {
            if (typeof document.body[fn] == 'function')
            {
                matchesFn = fn;
                return true;
            }
            return false;
        });

        let parent;

        // Check if the current element matches the selector
        if (el[matchesFn](selector))
        {
            return el;
        }

        // traverse parents
        while (el)
        {
            parent = el.parentElement;
            if (parent && parent[matchesFn](selector))
            {
                return parent;
            }
            el = parent;
        }

        return null;
    }

    getTranslateX(el: HTMLElement): number
    {
        let coordinates = null;

        try
        {
            const results = el.style.transform.match(/translate3d\((-?\d+px,\s?){2}-?\d+px\)/);

            if (results && results.length)
            {
                coordinates = results[0]
                    .replace('translate3d(', '')
                    .replace(')', '')
                    .replace(/\s/g, '')
                    .replace(/px/g, '')
                    .split(',');
            }
        }
        catch (e)
        {
            coordinates = null;
        }

        return (coordinates && (coordinates.length === 3)) ? parseInt(coordinates[0]) : 0;
    }

    getEventOffsetX(evt: any, el: HTMLElement): number
    {
        let x          = 0;
        let translateX = 0;

        while (el && !isNaN(el.offsetLeft))
        {
            translateX = this.getTranslateX(el);

            if (el.tagName === 'BODY')
            {
                x += el.offsetLeft + el.clientLeft + translateX - (el.scrollLeft || document.documentElement.scrollLeft);
            }
            else
            {
                x += el.offsetLeft + el.clientLeft + translateX - el.scrollLeft;
            }

            el = el.offsetParent as HTMLElement;
        }

        let eventX;
        if (typeof evt.touches !== 'undefined' && typeof evt.touches[0] !== 'undefined')
        {
            eventX = evt.touches[0].clientX;
        }
        else
        {
            eventX = evt.clientX
        }

        return eventX - x;
    }

    getEventOffsetY(evt, el): number
    {
        let fullscreenMultiplier = 1;
        const videoWrapper       = this.findClosestParent(el, 'div[id^="ww_video_wrapper_"]');

        if (videoWrapper)
        {
            const videoPlayerId = videoWrapper.id.replace('ww_video_wrapper_', '');

            const requestFullscreenFunctionNames = this.checkFullscreenSupport('ww_video_wrapper_' + videoPlayerId);
            if (requestFullscreenFunctionNames && document[(requestFullscreenFunctionNames as any).isFullscreen])
            {
                fullscreenMultiplier = 0;
            }
        }

        let y = 0;

        while (el && !isNaN(el.offsetTop))
        {
            if (el.tagName === 'BODY')
            {
                y += el.offsetTop - ((el.scrollTop || document.documentElement.scrollTop) * fullscreenMultiplier);

            }
            else
            {
                y += el.offsetTop - (el.scrollTop * fullscreenMultiplier);
            }

            el = el.offsetParent;
        }

        return evt.clientY - y;
    }

    onProgressbarMouseDown(event): void
    {
        this.displayOptions.layoutControls.playPauseAnimation = false;
        // we need an initial position for touchstart events, as mouse up has no offset x for iOS
        let initialPosition;

        if (this.displayOptions.layoutControls.showCardBoardView)
        {
            initialPosition = this.getEventOffsetX(event, event.target.parentNode);
        }
        else
        {
            initialPosition = this.getEventOffsetX(event, document.getElementById(this.videoPlayerId + '_ww_controls_progress_container'));
        }

        if (this.isCurrentlyPlayingAd)
        {
            return;
        }

        this.wwPseudoPause = true;

        const initiallyPaused = this.domRef.player.paused;
        if (!initiallyPaused)
        {
            this.domRef.player.pause();
        }

        const shiftTime = timeBarX =>
        {
            const totalWidth = document.getElementById(this.videoPlayerId + '_ww_controls_progress_container').clientWidth;
            if (totalWidth)
            {
                this.domRef.player.currentTime = this.currentVideoDuration * timeBarX / totalWidth;
            }
        };

        const onProgressbarMouseMove = event =>
        {
            const currentX  = this.getEventOffsetX(event, event.target.parentNode);
            initialPosition = NaN; // mouse up will fire after the move, we don't want to trigger the initial position in the event of iOS
            shiftTime(currentX);
            this.contolProgressbarUpdate(this.videoPlayerId);
            this.controlDurationUpdate(this.videoPlayerId);
        };

        const onProgressbarMouseUp = event =>
        {
            document.removeEventListener('mousemove', onProgressbarMouseMove);
            document.removeEventListener('touchmove', onProgressbarMouseMove);
            document.removeEventListener('mouseup', onProgressbarMouseUp);
            document.removeEventListener('touchend', onProgressbarMouseUp);

            let clickedX = this.getEventOffsetX(event, event.target.parentNode);

            if (isNaN(clickedX) && !isNaN(initialPosition))
            {
                clickedX = initialPosition;
            }

            if (!isNaN(clickedX))
            {
                shiftTime(clickedX);
            }

            if (!initiallyPaused)
            {
                this.play();
            }

            // Wait till video played then re-enable the animations
            if (this.initialAnimationSet)
            {
                setTimeout(() =>
                {
                    this.displayOptions.layoutControls.playPauseAnimation = this.initialAnimationSet;
                }, 200);
            }
            this.wwPseudoPause = false;
        };

        document.addEventListener('mouseup', onProgressbarMouseUp.bind(this));
        document.addEventListener('touchend', onProgressbarMouseUp.bind(this));
        document.addEventListener('mousemove', onProgressbarMouseMove.bind(this));
        document.addEventListener('touchmove', onProgressbarMouseMove.bind(this));
    }

    onVolumeBarMouseDown(): void
    {
        const shiftVolume = volumeBarX =>
        {
            const totalWidth = this.domRef.controls.volumeContainer.clientWidth;

            if (totalWidth)
            {
                let newVolume = volumeBarX / totalWidth;

                if (newVolume < 0.05)
                {
                    newVolume                = 0;
                    this.domRef.player.muted = true;
                }
                else if (newVolume > 0.95)
                {
                    newVolume = 1;
                }

                if (this.domRef.player.muted && newVolume > 0)
                {
                    this.domRef.player.muted = false;
                }

                this.setVolume(newVolume);
            }
        };

        const onVolumeBarMouseMove = event =>
        {
            const currentX = this.getEventOffsetX(event, this.domRef.controls.volumeContainer);
            shiftVolume(currentX);
        };

        const onVolumeBarMouseUp = event =>
        {
            document.removeEventListener('mousemove', onVolumeBarMouseMove);
            document.removeEventListener('touchmove', onVolumeBarMouseMove);
            document.removeEventListener('mouseup', onVolumeBarMouseUp);
            document.removeEventListener('touchend', onVolumeBarMouseUp);

            const currentX = this.getEventOffsetX(event, this.domRef.controls.volumeContainer);

            if (!isNaN(currentX))
            {
                shiftVolume(currentX);
            }
        };

        document.addEventListener('mouseup', onVolumeBarMouseUp.bind(this));
        document.addEventListener('touchend', onVolumeBarMouseUp.bind(this));
        document.addEventListener('mousemove', onVolumeBarMouseMove.bind(this));
        document.addEventListener('touchmove', onVolumeBarMouseMove.bind(this));
    }

    findRoll(roll): string[]
    {
        const ids  = [];
        ids.length = 0;

        if (!roll || !this.hasOwnProperty('adList'))
        {
            return;
        }

        for (let key in this.adList)
        {
            if (!this.adList.hasOwnProperty(key))
            {
                continue;
            }

            if (this.adList[key].roll === roll)
            {
                ids.push(key);
            }
        }

        return ids;
    }

    onKeyboardVolumeChange(direction): void
    {
        let volume = this.domRef.player.volume;

        if ('asc' === direction)
        {
            volume += 0.05;
        }
        else if ('desc' === direction)
        {
            volume -= 0.05;
        }

        if (volume < 0.05)
        {
            volume = 0;
        }
        else if (volume > 0.95)
        {
            volume = 1;
        }

        this.setVolume(volume);
    }

    onKeyboardSeekPosition(keyCode): void
    {
        if (this.isCurrentlyPlayingAd)
        {
            return;
        }

        this.domRef.player.currentTime = this.getNewCurrentTimeValueByKeyCode(
            keyCode,
            this.domRef.player.currentTime,
            this.domRef.player.duration
        );
    }

    getNewCurrentTimeValueByKeyCode(keyCode: number, currentTime: number, duration: number): number
    {
        let newCurrentTime = currentTime;

        switch (keyCode)
        {
            case 37://left arrow
                newCurrentTime -= 5;
                newCurrentTime = (newCurrentTime < 5) ? 0 : newCurrentTime;
                break;
            case 39://right arrow
                newCurrentTime += 5;
                newCurrentTime = (newCurrentTime > duration - 5) ? duration : newCurrentTime;
                break;
            case 35://End
                newCurrentTime = duration;
                break;
            case 36://Home
                newCurrentTime = 0;
                break;
            case 48://0
            case 49://1
            case 50://2
            case 51://3
            case 52://4
            case 53://5
            case 54://6
            case 55://7
            case 56://8
            case 57://9
                if (keyCode < 58 && keyCode > 47)
                {
                    const percent  = (keyCode - 48) * 10;
                    newCurrentTime = duration * percent / 100;
                }
                break;
        }

        return newCurrentTime;
    }

    handleMouseleave(event): void
    {
        if (typeof event.clientX !== 'undefined'
            && this.domRef.wrapper.contains(document.elementFromPoint(event.clientX, event.clientY)))
        {
            //false positive; we didn't actually leave the player
            return;
        }

        this.hideControlBar();
        this.hideTitle();
    }

    handleMouseenterForKeyboard(): void
    {
        if (this.captureKey)
        {
            return;
        }

        this.captureKey = event =>
        {
            event.stopPropagation();
            const keyCode = event.keyCode;

            switch (keyCode)
            {
                case 70://f
                    this.fullscreenToggle();
                    event.preventDefault();
                    break;
                case 13://Enter
                case 32://Space
                    this.playPauseToggle();
                    event.preventDefault();
                    break;
                case 77://m
                    this.muteToggle();
                    event.preventDefault();
                    break;
                case 38://up arrow
                    this.onKeyboardVolumeChange('asc');
                    event.preventDefault();
                    break;
                case 40://down arrow
                    this.onKeyboardVolumeChange('desc');
                    event.preventDefault();
                    break;
                case 37://left arrow
                case 39://right arrow
                case 35://End
                case 36://Home
                case 48://0
                case 49://1
                case 50://2
                case 51://3
                case 52://4
                case 53://5
                case 54://6
                case 55://7
                case 56://8
                case 57://9
                    this.onKeyboardSeekPosition(keyCode);
                    event.preventDefault();
                    break;
            }

            return false;
        };

        document.addEventListener('keydown', this.captureKey, true);
    }

    keyboardControl(): void
    {
        this.domRef.wrapper.addEventListener('click', this.handleMouseenterForKeyboard.bind(this), false);

        // When we click outside player, we stop registering keyboard events
        const clickHandler = this.handleWindowClick.bind(this);

        this.destructors.push(() =>
        {
            window.removeEventListener('click', clickHandler);
        });

        window.addEventListener('click', clickHandler);
    }

    handleWindowClick(e): void
    {
        if (!this.domRef.wrapper)
        {
            console.warn('Dangling click event listener should be collected for unknown wrapper ' + this.videoPlayerId
                + '. Did you forget to call destroy on player instance?');
            return;
        }

        const inScopeClick = this.domRef.wrapper.contains(e.target) || e.target.id === 'skipHref_' + this.videoPlayerId;

        if (inScopeClick)
        {
            return;
        }

        document.removeEventListener('keydown', this.captureKey, true);
        delete this['captureKey'];

        if (this.theatreMode && !this.theatreModeAdvanced)
        {
            this.theatreToggle();
        }
    }

    initialPlay(): void
    {
        this.domRef.player.addEventListener('playing', () =>
        {
            this.toggleLoader(false);
        });

        this.domRef.player.addEventListener('timeupdate', () =>
        {
            // some places we are manually displaying toggleLoader
            // user experience toggleLoader being displayed even when content is playing in background
            this.toggleLoader(false);
        });

        this.domRef.player.addEventListener('waiting', () =>
        {
            this.toggleLoader(true);
        });

        if (!this.displayOptions.layoutControls.playButtonShowing)
        {
            // Controls always showing until the video is first played
            const initialControlsDisplay = document.getElementById(this.videoPlayerId + '_ww_controls_container');
            initialControlsDisplay.classList.remove('initial_controls_show');
            // The logo shows before playing but may need to be removed
            const fpPlayer = document.getElementById(this.videoPlayerId + '_logo');
            if (fpPlayer)
            {
                fpPlayer.classList.remove('initial_controls_show');
            }
        }

        if (!this.firstPlayLaunched)
        {
            this.playPauseToggle();
            this.domRef.player.removeEventListener('play', this.initialPlay);
        }
    }

    playPauseToggle(): void
    {
        const isFirstStart = !this.firstPlayLaunched;
        const preRolls     = this.findRoll('preRoll');

        if (!isFirstStart || preRolls.length === 0)
        {
            if (isFirstStart && preRolls.length === 0)
            {
                this.firstPlayLaunched = true;
                this.displayOptions.vastOptions.vastAdvanced.noVastVideoCallback();
            }

            if (this.domRef.player.paused)
            {
                if (this.isCurrentlyPlayingAd && this.vastOptions !== null && this.vastOptions.vpaid)
                {
                    // resume the vpaid linear ad
                    if (this.getVPAID()?.resumeVpaidAd)
                    {
                        this.getVPAID().resumeVpaidAd();
                    }
                }
                else
                {
                    // resume the regular linear vast or content video player
                    if (this.dashPlayer)
                    {
                        this.dashPlayer.play();
                    }
                    else
                    {
                        this.domRef.player.play();
                    }
                }

                this.playPauseAnimationToggle(true);

            }
            else if (!isFirstStart)
            {
                if (this.isCurrentlyPlayingAd && this.vastOptions !== null && this.vastOptions.vpaid)
                {
                    // pause the vpaid linear ad
                    if (this.getVPAID()?.pauseVpaidAd)
                    {
                        this.getVPAID().pauseVpaidAd();
                    }
                }
                else
                {
                    // pause the regular linear vast or content video player
                    this.domRef.player.pause();
                }

                this.playPauseAnimationToggle(false);
            }

            if (this.getAddSupport()?.toggleOnPauseAd)
            {
                this.getAddSupport().toggleOnPauseAd();
            }
        }
        else
        {
            this.isCurrentlyPlayingAd = true;

            // Workaround for Safari or Mobile Chrome - otherwise it blocks the subsequent
            // play() command, because it considers it not being triggered by the user.
            // The URL is hardcoded here to cover widest possible use cases.
            // If you know of an alternative workaround for this issue - let us know!
            const browserVersion  = this.getUtils().getBrowserVersion();
            const isChromeAndroid = this.mobileInfo.userOs !== false
                && this.mobileInfo.userOs === 'Android'
                && browserVersion.browserName === 'Google Chrome';

            if ('Safari' === browserVersion.browserName || isChromeAndroid)
            {
                this.domRef.player.src = 'https://cdn.wwplayer.com/static/blank.mp4';
                this.domRef.player.play();
                this.playPauseAnimationToggle(true);
            }

            this.firstPlayLaunched = true;

            //trigger the loading of the VAST Tag
            if (this.getVAST()?.prepareVast)
            {
                this.getVAST().prepareVast('preRoll');
            }
            this.preRollAdPodsLength = preRolls.length;
        }

        const prepareVastAdsThatKnowDuration = () =>
        {
            if (this.getVAST()?.prepareVast)
            {
                this.getVAST().prepareVast('onPauseRoll');
                this.getVAST().prepareVast('postRoll');
                this.getVAST().prepareVast('midRoll');
            }
        };

        if (isFirstStart)
        {
            // Remove the div that was placed as a fix for poster image and DASH streaming, if it exists
            const pseudoPoster = document.getElementById(this.videoPlayerId + '_ww_pseudo_poster');
            if (pseudoPoster)
            {
                pseudoPoster.parentNode.removeChild(pseudoPoster);
            }

            if (this.mainVideoDuration > 0)
            {
                prepareVastAdsThatKnowDuration();
            }
            else
            {
                this.domRef.player.addEventListener('mainVideoDurationSet', prepareVastAdsThatKnowDuration.bind(this));
            }
        }

        if (this.getAddSupport()?.adTimer)
        {
            this.getAddSupport().adTimer();
        }

        const blockOnPause = document.getElementById(this.videoPlayerId + '_ww_html_on_pause');

        if (blockOnPause && !this.isCurrentlyPlayingAd)
        {
            if (this.domRef.player.paused)
            {
                blockOnPause.style.display = 'flex';
            }
            else
            {
                blockOnPause.style.display = 'none';
            }
        }
    }

    setCustomControls(): void
    {
        //Set the Play/Pause behaviour
        this.trackEvent(this.domRef.player.parentNode, 'click', '.ww_control_playpause', () =>
        {
            if (!this.firstPlayLaunched)
            {
                this.domRef.player.removeEventListener('play', this.initialPlay);
            }

            this.playPauseToggle();
        });

        this.domRef.player.addEventListener('play', () =>
        {
            this.controlPlayPauseToggle();
            this.contolVolumebarUpdate();
        }, false);

        this.domRef.player.addEventListener('wwplayerpause', () =>
        {
            this.controlPlayPauseToggle();
        }, false);

        //Set the progressbar
        this.domRef.player.addEventListener('timeupdate', () =>
        {
            this.contolProgressbarUpdate();
            this.controlDurationUpdate();
        });

        const isMobileChecks = this.getUtils().getMobileOs();
        const eventOn        = (isMobileChecks.userOs) ? 'touchstart' : 'mousedown';

        if (this.displayOptions.layoutControls.showCardBoardView)
        {
            this.trackEvent(
                this.domRef.player.parentNode,
                eventOn,
                '.ww_controls_progress_container',
                event => this.onProgressbarMouseDown(event)
            );
        }
        else
        {
            document.getElementById(this.videoPlayerId + '_ww_controls_progress_container')
                .addEventListener(eventOn, event => this.onProgressbarMouseDown(event), false);
        }

        //Set the volume controls
        document.getElementById(this.videoPlayerId + '_ww_control_volume_container')
            .addEventListener(eventOn, event => this.onVolumeBarMouseDown(), false);

        this.domRef.player.addEventListener('volumechange', () => this.contolVolumebarUpdate());

        this.trackEvent(this.domRef.player.parentNode, 'click', '.ww_control_mute', () => this.muteToggle());

        this.setBuffering();

        //Set the fullscreen control
        this.trackEvent(this.domRef.player.parentNode, 'click', '.ww_control_fullscreen', () => this.fullscreenToggle());

        // Theatre mode
        if (this.displayOptions.layoutControls.allowTheatre && !this.isInIframe)
        {
            document.getElementById(this.videoPlayerId + '_ww_control_theatre').style.display = 'inline-block';
            this.trackEvent(this.domRef.player.parentNode, 'click', '.ww_control_theatre', () => this.theatreToggle());
        }
        else
        {
            document.getElementById(this.videoPlayerId + '_ww_control_theatre').style.display = 'none';
        }

        this.domRef.player.addEventListener('ratechange', () =>
        {
            if (this.isCurrentlyPlayingAd)
            {
                this.playbackRate = 1;
            }
        });
    }

    /**
     * Create the time position preview only if the vtt previews aren't enabled
     */
    createTimePositionPreview(): void
    {
        if (!this.showTimeOnHover)
        {
            return;
        }

        const progressContainer = document.getElementById(this.videoPlayerId + '_ww_controls_progress_container');
        const previewContainer  = document.createElement('div');

        previewContainer.id             = this.videoPlayerId + '_ww_timeline_preview';
        previewContainer.className      = 'ww_timeline_preview';
        previewContainer.style.display  = 'none';
        previewContainer.style.position = 'absolute';

        progressContainer.appendChild(previewContainer);

        // Set up hover for time position preview display
        document.getElementById(this.videoPlayerId + '_ww_controls_progress_container')
            .addEventListener('mousemove', event =>
            {
                const progressContainer = document.getElementById(this.videoPlayerId + '_ww_controls_progress_container');
                const totalWidth        = progressContainer.clientWidth;
                const hoverTimeItem     = document.getElementById(this.videoPlayerId + '_ww_timeline_preview');
                const hoverQ            = this.getEventOffsetX(event, progressContainer);

                const hoverSecondQ      = this.currentVideoDuration * hoverQ / totalWidth;
                hoverTimeItem.innerText = this.getUtils().formatTime(hoverSecondQ);

                hoverTimeItem.style.display = 'block';
                hoverTimeItem.style.left    = (hoverSecondQ / this.domRef.player.duration * 100) + '%';
            }, false);

        // Hide timeline preview on mouseout
        document.getElementById(this.videoPlayerId + '_ww_controls_progress_container')
            .addEventListener('mouseout', () =>
            {
                const hoverTimeItem         = document.getElementById(this.videoPlayerId + '_ww_timeline_preview');
                hoverTimeItem.style.display = 'none';
            }, false);
    }

    setCustomContextMenu(): void
    {
        const playerWrapper       = this.domRef.wrapper;
        const showDefaultControls = this.displayOptions.layoutControls.contextMenu.controls;
        const extraLinks          = this.displayOptions.layoutControls.contextMenu.links;

        //Create own context menu
        const divContextMenu          = document.createElement('div');
        divContextMenu.id             = this.videoPlayerId + '_ww_context_menu';
        divContextMenu.className      = 'ww_context_menu';
        divContextMenu.style.display  = 'none';
        divContextMenu.style.position = 'absolute';

        const contextMenuList = document.createElement('ul');
        divContextMenu.appendChild(contextMenuList);

        if (!!extraLinks)
        {
            for (const link of extraLinks)
            {
                const linkItem     = document.createElement('li');
                linkItem.id        = this.videoPlayerId + 'context_option_play';
                linkItem.innerHTML = link.label;
                linkItem.addEventListener('click', () => window.open(link.href, '_blank'), false);
                contextMenuList.appendChild(linkItem);
            }
        }

        if (showDefaultControls)
        {
            const menuItemPlay     = document.createElement('li');
            menuItemPlay.id        = this.videoPlayerId + 'context_option_play';
            menuItemPlay.innerHTML = this.displayOptions.captions.play;
            menuItemPlay.addEventListener('click', () => this.playPauseToggle(), false);
            contextMenuList.appendChild(menuItemPlay);

            const menuItemMute     = document.createElement('li');
            menuItemMute.id        = this.videoPlayerId + 'context_option_mute';
            menuItemMute.innerHTML = this.displayOptions.captions.mute;
            menuItemMute.addEventListener('click', () => this.muteToggle(), false);
            contextMenuList.appendChild(menuItemMute);

            const menuItemFullscreen     = document.createElement('li');
            menuItemFullscreen.id        = this.videoPlayerId + 'context_option_fullscreen';
            menuItemFullscreen.innerHTML = this.displayOptions.captions.fullscreen;
            menuItemFullscreen.addEventListener('click', () => this.fullscreenToggle(), false);
            contextMenuList.appendChild(menuItemFullscreen);
        }

        // const menuItemVersion     = document.createElement('li');
        // menuItemVersion.id        = this.videoPlayerId + 'context_option_homepage';
        // menuItemVersion.innerHTML = 'WW Player ' + this.version;
        // menuItemVersion.addEventListener('click', () => window.open(this.homepage, '_blank'), false)
        // contextMenuList.appendChild(menuItemVersion);

        this.domRef.player.parentNode.insertBefore(divContextMenu, this.domRef.player.nextSibling);

        //Disable the default context menu
        playerWrapper.addEventListener('contextmenu', e =>
        {
            e.preventDefault();

            divContextMenu.style.left    = this.getEventOffsetX(e, this.domRef.player) + 'px';
            divContextMenu.style.top     = this.getEventOffsetY(e, this.domRef.player) + 'px';
            divContextMenu.style.display = 'block';
        }, false);

        //Hide the context menu on clicking elsewhere
        document.addEventListener('click', e =>
        {
            if ((e.target !== this.domRef.player) || e.button !== 2)
            {
                divContextMenu.style.display = 'none';
            }
        }, false);
    }

    setDefaultLayout(): void
    {
        this.domRef.wrapper.className += ' ww_player_layout_' + this.displayOptions.layoutControls.layout;

        this.setCustomContextMenu();

        const controls = this.generateCustomControlTags({
            displayVolumeBar      : this.checkShouldDisplayVolumeBar(),
            primaryColor          : this.displayOptions.layoutControls.primaryColor
                ? this.displayOptions.layoutControls.primaryColor
                : 'red',
            controlForwardBackward: !!this.displayOptions.layoutControls.controlForwardBackward.show
        });

        // Remove the default controls
        this.domRef.player.removeAttribute('controls');

        // Insert custom controls and append loader
        this.domRef.player.parentNode.insertBefore(controls.root, this.domRef.player.nextSibling);
        this.domRef.player.parentNode.insertBefore(controls.loader, this.domRef.player.nextSibling);

        // Register controls locally
        this.domRef.controls = controls;

        /**
         * Set the volumebar after its elements are properly rendered.
         */
        let remainingAttemptsToInitiateVolumeBar = 100;

        const initiateVolumebar      = () =>
        {
            if (!remainingAttemptsToInitiateVolumeBar)
            {
                clearInterval(initiateVolumebarTimerId);
            }
            else if (this.checkIfVolumebarIsRendered())
            {
                clearInterval(initiateVolumebarTimerId);
                this.contolVolumebarUpdate(this.videoPlayerId);
            }
            else
            {
                remainingAttemptsToInitiateVolumeBar--;
            }
        };
        let initiateVolumebarTimerId = setInterval(initiateVolumebar, 100);

        if (this.displayOptions.layoutControls.doubleclickFullscreen)
        {
            this.domRef.player.addEventListener('dblclick', this.fullscreenToggle.bind(this));
        }

        this.initHtmlOnPauseBlock();

        this.setCustomControls();

        if (this.getTimeline()?.setupThumbnailPreview)
        {
            this.getTimeline().setupThumbnailPreview();
        }

        this.createTimePositionPreview();

        this.posterImage();

        this.initPlayButton();

        this.setVideoPreload();

        this.createPlaybackList();

        this.createDownload();

        if (!!this.displayOptions.layoutControls.controlForwardBackward.show)
        {
            this.initSkipControls();
        }
    }

    initSkipControls(): void
    {
        const skipFunction = (period) =>
        {
            if (this.isCurrentlyPlayingAd)
            {
                return;
            }

            let skipTo = this.domRef.player.currentTime + period;
            if (skipTo < 0)
            {
                skipTo = 0;
            }
            this.domRef.player.currentTime = skipTo;
        };

        this.domRef.controls.skipBack.addEventListener('click', skipFunction.bind(this, -10));
        this.domRef.controls.skipForward.addEventListener('click', skipFunction.bind(this, 10));
    }

    /**
     * Checks if the volumebar is rendered and the styling applied by comparing
     * the width of 2 elements that should look different.
     */
    checkIfVolumebarIsRendered(): boolean
    {
        const volumeposTag        = document.getElementById(this.videoPlayerId + '_ww_control_volume_currentpos');
        const volumebarTotalWidth = document.getElementById(this.videoPlayerId + '_ww_control_volume').clientWidth;
        const volumeposTagWidth   = volumeposTag.clientWidth;

        return volumeposTagWidth !== volumebarTotalWidth;
    }

    setLayout(): void
    {
        //All other browsers
        const listenTo = (this.getUtils().isTouchDevice()) ? 'touchend' : 'click';
        this.domRef.player.addEventListener(listenTo, () => this.playPauseToggle(), false);
        //Mobile Safari - because it does not emit a click event on initial click of the video
        this.domRef.player.addEventListener('play', this.initialPlay.bind(this), false);
        this.setDefaultLayout();
    }

    handleFullscreen(): void
    {
        if (typeof document['vastFullsreenChangeEventListenersAdded'] !== 'undefined')
        {
            return;
        }

        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'msfullscreenchange'].forEach(eventType =>
        {
            if (typeof (document['on' + eventType]) === 'object')
            {
                if (this.getVAST()?.recalculateAdDimensions)
                {
                    document.addEventListener(eventType, ev =>
                    {
                        this.getVAST().recalculateAdDimensions();
                    }, false);
                }
            }
        });

        (document as any).vastFullsreenChangeEventListenersAdded = true;
    }

    setupPlayerWrapper(): HTMLDivElement
    {
        const wrapper = document.createElement('div');

        wrapper.id        = 'ww_video_wrapper_' + this.videoPlayerId;
        wrapper.className = this.getUtils().isTouchDevice()
            ? 'ww_video_wrapper mobile'
            : 'ww_video_wrapper';

        //Assign the height/width dimensions to the wrapper
        if (this.displayOptions.layoutControls.fillToContainer)
        {
            wrapper.style.width  = '100%';
            wrapper.style.height = '100%';
        }
        else
        {
            wrapper.style.height = this.domRef.player.clientHeight + 'px';
            wrapper.style.width  = this.domRef.player.clientWidth + 'px';
        }

        this.domRef.player.style.height = '100%';
        this.domRef.player.style.width  = '100%';

        this.domRef.player.parentNode.insertBefore(wrapper, this.domRef.player);
        wrapper.appendChild(this.domRef.player);

        return wrapper;
    }

    onErrorDetection(): void
    {
        if (this.domRef.player.networkState === this.domRef.player.NETWORK_NO_SOURCE && this.isCurrentlyPlayingAd)
        {
            //Probably the video ad file was not loaded successfully
            if (this.getVAST()?.playMainVideoWhenVastFails)
            {
                this.getVAST().playMainVideoWhenVastFails(401);
            }
        }
    }

    createVideoSourceSwitch(): void
    {
        const sources     = [];
        const sourcesList = this.domRef.player.querySelectorAll('source');
        [].forEach.call(sourcesList, source =>
        {
            if (source.title && source.src)
            {
                sources.push({
                    'title': source.title,
                    'url'  : source.src,
                    'isHD' : (source.getAttribute('data-ww-hd') != null)
                });
            }
        });

        this.videoSources = sources;
        if (this.videoSources.length <= 1)
        {
            return;
        }

        const sourceChangeButton         = document.getElementById(this.videoPlayerId + '_ww_control_video_source');
        sourceChangeButton.style.display = 'inline-block';

        let appendSourceChange = false;

        const sourceChangeList         = document.createElement('div');
        sourceChangeList.id            = this.videoPlayerId + '_ww_control_video_source_list';
        sourceChangeList.className     = 'ww_video_sources_list';
        sourceChangeList.style.display = 'none';

        let firstSource = true;
        for (const source of this.videoSources)
        {
            // Fix for issues occurring on iOS with mkv files
            const getTheType = source.url.split('.').pop();
            if (this.mobileInfo.userOs === 'iOS' && getTheType === 'mkv')
            {
                continue;
            }

            const sourceSelected      = (firstSource) ? 'source_selected' : '';
            const hdElement           = (source.isHD) ? '<sup style="color:' + this.displayOptions.layoutControls.primaryColor + '" class="fp_hd_source"></sup>' : '';
            firstSource               = false;
            const sourceChangeDiv     = document.createElement('div');
            sourceChangeDiv.id        = 'source_' + this.videoPlayerId + '_' + source.title;
            sourceChangeDiv.className = 'ww_video_source_list_item';
            sourceChangeDiv.innerHTML = '<span class="source_button_icon ' + sourceSelected + '"></span>' + source.title + hdElement;

            const self = this;
            sourceChangeDiv.addEventListener('click', function (event)
            {
                event.stopPropagation();
                // While changing source the player size can flash, we want to set the pixel dimensions then back to 100% afterwards
                self.domRef.player.style.width  = self.domRef.player.clientWidth + 'px';
                self.domRef.player.style.height = self.domRef.player.clientHeight + 'px';

                const videoChangedTo = this;
                const sourceIcons    = document.getElementsByClassName('source_button_icon');
                for (let i = 0; i < sourceIcons.length; i++)
                {
                    sourceIcons[i].className = sourceIcons[i].className.replace('source_selected', '');
                }
                (videoChangedTo.firstChild as HTMLElement).className += ' source_selected';

                self.videoSources.forEach(source =>
                {
                    if (source.title === videoChangedTo.innerText.replace(/(\r\n\t|\n|\r\t)/gm, ''))
                    {
                        self.setBuffering();
                        self.setVideoSource(source.url);
                        self.wwStorage.fluidQuality = source.title;
                    }
                });

                self.openCloseVideoSourceSwitch();
            });

            sourceChangeList.appendChild(sourceChangeDiv);
            appendSourceChange = true;
        }

        if (appendSourceChange)
        {
            sourceChangeButton.appendChild(sourceChangeList);
            sourceChangeButton.addEventListener('click', () =>
            {
                this.openCloseVideoSourceSwitch();
            });
        }
        else
        {
            // Didn't give any source options
            document.getElementById(this.videoPlayerId + '_ww_control_video_source').style.display = 'none';
        }
    }

    openCloseVideoSourceSwitch(): void
    {
        const sourceChangeList = document.getElementById(this.videoPlayerId + '_ww_control_video_source_list');

        if (this.isCurrentlyPlayingAd)
        {
            sourceChangeList.style.display = 'none';
            return;
        }

        if (sourceChangeList.style.display !== 'none')
        {
            sourceChangeList.style.display = 'none';
            return;
        }

        sourceChangeList.style.display = 'block';
        const mouseOut                 = () =>
        {
            sourceChangeList.removeEventListener('mouseleave', mouseOut);
            sourceChangeList.style.display = 'none';
        };
        sourceChangeList.addEventListener('mouseleave', mouseOut);
    }

    setVideoSource(url: string): boolean
    {
        if (this.mobileInfo.userOs === 'iOS' && url.indexOf('.mkv') > 0)
        {
            console.log('[WWP_ERROR] .mkv files not supported by iOS devices.');
            return false;
        }

        if (this.isCurrentlyPlayingAd)
        {
            this.originalSrc = url;
            return;
        }

        this.isSwitchingSource = true;
        let play               = false;
        if (!this.domRef.player.paused)
        {
            this.domRef.player.pause();
            play = true;
        }

        const currentTime = this.domRef.player.currentTime;
        this.setCurrentTimeAndPlay(currentTime, play);

        this.domRef.player.src                       = url;
        this.originalSrc                             = url;
        this.displayOptions.layoutControls.mediaType = this.getCurrentSrcType();
        if (this.getStreaming()?.initialiseStreamers)
        {
            this.getStreaming().initialiseStreamers();
        }
    }

    setCurrentTimeAndPlay(newCurrentTime: number, shouldPlay: boolean): void
    {
        const loadedMetadata = () =>
        {
            this.domRef.player.currentTime = newCurrentTime;
            this.domRef.player.removeEventListener('loadedmetadata', loadedMetadata);
            // Safari ios and mac fix to set currentTime
            if (this.mobileInfo.userOs === 'iOS' || this.getUtils().getBrowserVersion().browserName
                .toLowerCase() === 'safari')
            {
                this.domRef.player.addEventListener('playing', videoPlayStart.bind(this));
            }

            if (shouldPlay)
            {
                this.domRef.player.play();
            }
            else
            {
                this.domRef.player.pause();
                this.controlPlayPauseToggle(this.videoPlayerId);
            }

            this.isSwitchingSource          = false;
            this.domRef.player.style.width  = '100%';
            this.domRef.player.style.height = '100%';
        };

        let videoPlayStart = () =>
        {
            this.currentTime = newCurrentTime;
            this.domRef.player.removeEventListener('playing', videoPlayStart);
        };

        this.domRef.player.addEventListener('loadedmetadata', loadedMetadata.bind(this), false);
        this.domRef.player.load();
    }

    initTitle(): void
    {
        if (!this.displayOptions.layoutControls.title)
        {
            return;
        }

        const titleHolder = document.createElement('div');
        titleHolder.id    = this.videoPlayerId + '_title';
        this.domRef.player.parentNode.insertBefore(titleHolder, null);
        titleHolder.innerHTML += this.displayOptions.layoutControls.title;
        titleHolder.classList.add('fp_title');
    }

    hasTitle(): boolean
    {
        const title       = document.getElementById(this.videoPlayerId + '_title');
        const titleOption = this.displayOptions.layoutControls.title;
        return title && titleOption != null;
    }

    hideTitle(): void
    {
        const titleHolder = document.getElementById(this.videoPlayerId + '_title');

        if (!this.hasTitle())
        {
            return;
        }

        titleHolder.classList.add('fade_out');
    }

    showTitle(): void
    {
        const titleHolder = document.getElementById(this.videoPlayerId + '_title');

        if (!this.hasTitle())
        {
            return;
        }

        titleHolder.classList.remove('fade_out');
    }

    initLogo(): void
    {
        if (!this.displayOptions.layoutControls.logo.imageUrl)
        {
            return;
        }

        // Container div for the logo
        // This is to allow for fade in and out logo_maintain_display
        const logoHolder = document.createElement('div');
        logoHolder.id    = this.videoPlayerId + '_logo';
        let hideClass    = 'logo_maintain_display';
        if (this.displayOptions.layoutControls.logo.hideWithControls)
        {
            hideClass = 'initial_controls_show';
        }
        logoHolder.classList.add(hideClass, 'fp_logo');

        // The logo itself
        const logoImage = document.createElement('img');
        logoImage.id    = this.videoPlayerId + '_logo_image';
        if (this.displayOptions.layoutControls.logo.imageUrl)
        {
            logoImage.src = this.displayOptions.layoutControls.logo.imageUrl;
        }

        logoImage.style.position = 'absolute';
        logoImage.style.margin   = this.displayOptions.layoutControls.logo.imageMargin;
        const logoPosition       = this.displayOptions.layoutControls.logo.position.toLowerCase();

        if (logoPosition.indexOf('bottom') !== -1)
        {
            logoImage.style.bottom = '0';
        }
        else
        {
            logoImage.style.top = '0';
        }
        if (logoPosition.indexOf('right') !== -1)
        {
            logoImage.style.right = '0';
        }
        else
        {
            logoImage.style.left = '0';
        }
        if (this.displayOptions.layoutControls.logo.opacity)
        {
            logoImage.style.opacity = String(this.displayOptions.layoutControls.logo.opacity);
        }

        if (this.displayOptions.layoutControls.logo.clickUrl !== null)
        {
            logoImage.style.cursor = 'pointer';
            logoImage.addEventListener('click', () =>
            {
                const win = window.open(this.displayOptions.layoutControls.logo.clickUrl, '_blank');
                win.focus();
            });
        }

        // If a mouseOverImage is provided then we must set up the listeners for it
        if (this.displayOptions.layoutControls.logo.mouseOverImageUrl)
        {
            logoImage.addEventListener('mouseover', () =>
            {
                logoImage.src = this.displayOptions.layoutControls.logo.mouseOverImageUrl;
            }, false);
            logoImage.addEventListener('mouseout', () =>
            {
                logoImage.src = this.displayOptions.layoutControls.logo.imageUrl;
            }, false);
        }

        this.domRef.player.parentNode.insertBefore(logoHolder, null);
        logoHolder.appendChild(logoImage);
    }

    initHtmlOnPauseBlock(): void
    {
        //If onPauseRoll is defined than HtmlOnPauseBlock won't be shown
        if (this.getAddSupport()?.hasValidOnPauseAd && this.getAddSupport().hasValidOnPauseAd())
        {
            return;
        }

        if (!this.displayOptions.layoutControls.htmlOnPauseBlock.html)
        {
            return;
        }

        const containerDiv         = document.createElement('div');
        containerDiv.id            = this.videoPlayerId + '_ww_html_on_pause';
        containerDiv.className     = 'ww_html_on_pause';
        containerDiv.style.display = 'none';
        containerDiv.innerHTML     = this.displayOptions.layoutControls.htmlOnPauseBlock.html;
        containerDiv.onclick       = (event) =>
        {
            this.playPauseToggle();
        };

        if (this.displayOptions.layoutControls.htmlOnPauseBlock.width)
        {
            containerDiv.style.width = this.displayOptions.layoutControls.htmlOnPauseBlock.width + 'px';
        }

        if (this.displayOptions.layoutControls.htmlOnPauseBlock.height)
        {
            containerDiv.style.height = this.displayOptions.layoutControls.htmlOnPauseBlock.height + 'px';
        }

        this.domRef.player.parentNode.insertBefore(containerDiv, null);
    }

    /**
     * Play button in the middle when the video loads
     */
    initPlayButton(): void
    {
        // Create the html fpr the play button
        const containerDiv     = document.createElement('div');
        containerDiv.id        = this.videoPlayerId + '_ww_initial_play_button';
        containerDiv.className = 'ww_html_on_pause';
        const backgroundColor  = (this.displayOptions.layoutControls.primaryColor) ? this.displayOptions.layoutControls.primaryColor : '#333333';
        containerDiv.innerHTML = '<div id="' + this.videoPlayerId + '_ww_initial_play" class="ww_initial_play" style="background-color:' + backgroundColor + '"><div id="' + this.videoPlayerId + '_ww_state_button" class="ww_initial_play_button"></div></div>';
        const initPlayFunction = () =>
        {
            this.playPauseToggle();
            containerDiv.removeEventListener('click', initPlayFunction);
        };
        containerDiv.addEventListener('click', initPlayFunction.bind(this));

        // If the user has chosen to not show the play button we'll make it invisible
        // We don't hide altogether because animations might still be used
        if (!this.displayOptions.layoutControls.playButtonShowing)
        {
            const initialControlsDisplay = document.getElementById(this.videoPlayerId + '_ww_controls_container');
            initialControlsDisplay.classList.add('initial_controls_show');
            containerDiv.style.opacity = '0';
        }

        this.domRef.player.parentNode.insertBefore(containerDiv, null);
    };

    /**
     * Set the mainVideoDuration property one the video is loaded
     */
    mainVideoReady(): void
    {
        if (!(this.mainVideoDuration === 0 && !this.isCurrentlyPlayingAd && this.mainVideoReadyState === false))
        {
            return;
        }
        const event = new CustomEvent('mainVideoDurationSet');

        this.mainVideoDuration   = this.domRef.player.duration;
        this.mainVideoReadyState = true;
        this.domRef.player.dispatchEvent(event);
        this.domRef.player.removeEventListener('loadedmetadata', this.mainVideoReady);
    }

    userActivityChecker(): void
    {
        const videoPlayer = this.domRef.wrapper;
        this.newActivity  = null;

        let isMouseStillDown = false;

        const activity = event =>
        {
            if (event.type === 'touchstart' || event.type === 'mousedown')
            {
                isMouseStillDown = true;
            }
            if (event.type === 'touchend' || event.type === 'mouseup')
            {
                isMouseStillDown = false;
            }
            this.newActivity = true;
        };

        setInterval(() =>
        {
            if (this.newActivity !== true)
            {
                return;
            }

            if (!isMouseStillDown && !this.isLoading)
            {
                this.newActivity = false;
            }

            if (this.isUserActive === false || !this.isControlBarVisible())
            {
                let event = new CustomEvent('userActive');
                this.domRef.player.dispatchEvent(event);
                this.isUserActive = true;
            }

            clearTimeout(this.inactivityTimeout);

            this.inactivityTimeout = setTimeout(() =>
            {
                if (this.newActivity === true)
                {
                    clearTimeout(this.inactivityTimeout);
                    return;
                }

                this.isUserActive = false;

                let event = new CustomEvent('userInactive');
                this.domRef.player.dispatchEvent(event);
            }, this.displayOptions.layoutControls.controlBar.autoHideTimeout * 1000);
        }, 300);

        const listenTo = (this.getUtils().isTouchDevice())
            ? ['touchstart', 'touchmove', 'touchend']
            : ['mousemove', 'mousedown', 'mouseup'];

        for (let i = 0; i < listenTo.length; i++)
        {
            videoPlayer.addEventListener(listenTo[i], activity);
        }
    }

    hasControlBar(): boolean
    {
        return !!document.getElementById(this.videoPlayerId + '_ww_controls_container');
    }

    isControlBarVisible(): boolean
    {
        if (this.hasControlBar() === false)
        {
            return false;
        }

        const controlBar = document.getElementById(this.videoPlayerId + '_ww_controls_container');
        const style      = window.getComputedStyle(controlBar, null);
        return !(Number(style.opacity) === 0 || style.visibility === 'hidden');
    }

    setVideoPreload(): void
    {
        this.domRef.player.setAttribute('preload', this.displayOptions.layoutControls.preload);
    }

    hideControlBar(): void
    {
        if (this.isCurrentlyPlayingAd && !this.domRef.player.paused)
        {
            if (this.getAddSupport()?.toggleAdCountdown)
            {
                this.getAddSupport().toggleAdCountdown(true);
            }
        }

        this.domRef.player.style.cursor = 'none';

        // handles both VR and Normal condition
        if (!this.hasControlBar())
        {
            return;
        }

        const divVastControls = (this.domRef.player.parentNode as HTMLElement).getElementsByClassName('ww_controls_container');
        const fpLogo          = (this.domRef.player.parentNode as HTMLElement).getElementsByClassName('fp_logo');

        for (let i = 0; i < divVastControls.length; i++)
        {
            if (this.displayOptions.layoutControls.controlBar.animated)
            {
                divVastControls[i].classList.remove('fade_in');
                divVastControls[i].classList.add('fade_out');
            }
            else
            {
                (divVastControls[i] as HTMLElement).style.display = 'none';
            }
        }

        for (let i = 0; i < fpLogo.length; i++)
        {
            if (this.displayOptions.layoutControls.controlBar.animated)
            {
                if (fpLogo[i])
                {
                    fpLogo[i].classList.remove('fade_in');
                    fpLogo[i].classList.add('fade_out');
                }
            }
            else
            {
                if (fpLogo[i])
                {
                    (fpLogo[i] as HTMLElement).style.display = 'none';
                }
            }
        }
    }

    showControlBar(): void
    {
        if (this.isCurrentlyPlayingAd && !this.domRef.player.paused)
        {
            if (this.getAddSupport()?.toggleAdCountdown)
            {
                this.getAddSupport().toggleAdCountdown(false);
            }
        }

        if (!this.getUtils().isTouchDevice())
        {
            this.domRef.player.style.cursor = 'default';
        }

        if (!this.hasControlBar())
        {
            return;
        }

        const divVastControls = (this.domRef.player.parentNode as HTMLElement).getElementsByClassName('ww_controls_container');
        const fpLogo          = (this.domRef.player.parentNode as HTMLElement).getElementsByClassName('fp_logo');
        for (let i = 0; i < divVastControls.length; i++)
        {
            if (this.displayOptions.layoutControls.controlBar.animated)
            {
                divVastControls[i].classList.remove('fade_out');
                divVastControls[i].classList.add('fade_in');
            }
            else
            {
                (divVastControls[i] as HTMLElement).style.display = 'block';
            }
        }

        for (let i = 0; i < fpLogo.length; i++)
        {
            if (this.displayOptions.layoutControls.controlBar.animated)
            {
                if (fpLogo[i])
                {
                    fpLogo[i].classList.remove('fade_out');
                    fpLogo[i].classList.add('fade_in');
                }
            }
            else
            {
                if (fpLogo[i])
                {
                    (fpLogo[i] as HTMLElement).style.display = 'block';
                }
            }
        }
    }

    linkControlBarUserActivity(): void
    {
        this.domRef.player.addEventListener('userInactive', this.hideControlBar.bind(this));
        this.domRef.player.addEventListener('userInactive', this.hideTitle.bind(this));

        this.domRef.player.addEventListener('userActive', this.showControlBar.bind(this));
        this.domRef.player.addEventListener('userActive', this.showTitle.bind(this));
    }

    initMute(): void
    {
        if (this.displayOptions.layoutControls.mute !== true)
        {
            return;
        }

        this.domRef.player.volume = 0;
    }

    initLoop(): void
    {
        this.domRef.player.loop = !!this.displayOptions.layoutControls.loop;
    }

    setBuffering(): void
    {
        let progressInterval;
        const bufferBar = (this.domRef.player.parentNode as HTMLElement).getElementsByClassName('ww_controls_buffered');

        for (let j = 0; j < bufferBar.length; j++)
        {
            (bufferBar[j] as HTMLElement).style.width = '0';
        }

        // Buffering
        const logProgress = () =>
        {
            const duration = this.domRef.player.duration;
            if (duration <= 0)
            {
                return;
            }

            for (let i = 0; i < this.domRef.player.buffered.length; i++)
            {
                if (this.domRef.player.buffered.start(this.domRef.player.buffered.length - 1 - i) >= this.domRef.player.currentTime)
                {
                    continue;
                }

                const newBufferLength = (this.domRef.player.buffered.end(this.domRef.player.buffered.length - 1 - i) / duration) * 100 + '%';

                for (let j = 0; j < bufferBar.length; j++)
                {
                    (bufferBar[j] as HTMLElement).style.width = newBufferLength;
                }

                // Stop checking for buffering if the video is fully buffered
                if (!!progressInterval && 1 === (this.domRef.player.buffered.end(this.domRef.player.buffered.length - 1 - i) / duration))
                {
                    clearInterval(progressInterval);
                }

                break;
            }
        };
        progressInterval  = setInterval(logProgress, 500);
    }

    createPlaybackList(): void
    {
        const playbackRates = ['x2', 'x1.5', 'x1', 'x0.5'];
        const self          = this;

        if (!self.displayOptions.layoutControls.playbackRateEnabled)
        {
            return;
        }

        document.getElementById(self.videoPlayerId + '_ww_control_playback_rate').style.display = 'inline-block';

        const sourceChangeButton = document.getElementById(self.videoPlayerId + '_ww_control_playback_rate');

        const sourceChangeList         = document.createElement('div');
        sourceChangeList.id            = self.videoPlayerId + '_ww_control_video_playback_rate';
        sourceChangeList.className     = 'ww_video_playback_rates';
        sourceChangeList.style.display = 'none';

        playbackRates.forEach(function (rate)
        {
            const sourceChangeDiv     = document.createElement('div');
            sourceChangeDiv.className = 'ww_video_playback_rates_item';
            sourceChangeDiv.innerText = rate;

            sourceChangeDiv.addEventListener('click', function (event)
            {
                event.stopPropagation();
                let playbackRate = this.innerText.replace('x', '');
                self.setPlaybackSpeed(playbackRate);
                self.openCloseVideoPlaybackRate();

            });
            sourceChangeList.appendChild(sourceChangeDiv);
        });

        sourceChangeButton.appendChild(sourceChangeList);
        sourceChangeButton.addEventListener('click', function ()
        {
            self.openCloseVideoPlaybackRate();
        });
    }

    openCloseVideoPlaybackRate(): void
    {
        const sourceChangeList = document.getElementById(this.videoPlayerId + '_ww_control_video_playback_rate');

        if (this.isCurrentlyPlayingAd || 'none' !== sourceChangeList.style.display)
        {
            sourceChangeList.style.display = 'none';
            return;
        }

        sourceChangeList.style.display = 'block';
        const mouseOut                 = function ()
        {
            sourceChangeList.removeEventListener('mouseleave', mouseOut);
            sourceChangeList.style.display = 'none';
        };
        sourceChangeList.addEventListener('mouseleave', mouseOut);
    }

    createDownload(): void
    {
        const self           = this;
        const downloadOption = document.getElementById(self.videoPlayerId + '_ww_control_download');
        if (!self.displayOptions.layoutControls.allowDownload)
        {
            return;
        }
        downloadOption.style.display = 'inline-block';

        let downloadClick     = document.createElement('a');
        downloadClick.id      = self.videoPlayerId + '_download';
        downloadClick.onclick = function (e)
        {
            const linkItem = this as HTMLAnchorElement;

            if (typeof e.stopImmediatePropagation !== 'undefined')
            {
                e.stopImmediatePropagation();
            }

            setInterval(() =>
            {
                linkItem.download = '';
                linkItem.href     = '';
            }, 100);
        };

        downloadOption.appendChild(downloadClick);

        downloadOption.addEventListener('click', () =>
        {
            const downloadItem    = document.getElementById(self.videoPlayerId + '_download') as HTMLAnchorElement;
            downloadItem.download = self.originalSrc;
            downloadItem.href     = self.originalSrc;
            downloadClick.click();
        });
    }

    theatreToggle(): void
    {
        if (this.isInIframe)
        {
            return;
        }

        // Theatre and fullscreen, it's only one or the other
        if (this.fullscreenMode)
        {
            this.fullscreenToggle();
        }

        // Advanced Theatre mode if specified
        if (this.displayOptions.layoutControls.theatreAdvanced)
        {
            const elementForTheatre   = document.getElementById((this.displayOptions.layoutControls.theatreAdvanced as any).theatreElement);
            const theatreClassToApply = (this.displayOptions.layoutControls.theatreAdvanced as any).classToApply;
            if (elementForTheatre != null && theatreClassToApply != null)
            {
                if (!this.theatreMode)
                {
                    elementForTheatre.classList.add(theatreClassToApply);
                }
                else
                {
                    elementForTheatre.classList.remove(theatreClassToApply);
                }
                this.theatreModeAdvanced = !this.theatreModeAdvanced;
            }
            else
            {
                console.log('[WWP_ERROR] Theatre mode elements could not be found, defaulting behaviour.');
                // Default overlay behaviour
                this.defaultTheatre();
            }
        }
        else
        {
            // Default overlay behaviour
            this.defaultTheatre();
        }

        // Set correct variables
        this.theatreMode         = !this.theatreMode;
        this.wwStorage.wwTheatre = this.theatreMode;

        // Trigger theatre event
        const theatreEvent = (this.theatreMode) ? 'theatreModeOn' : 'theatreModeOff';
        const event        = document.createEvent('CustomEvent');
        event.initEvent(theatreEvent, false, true);
        this.domRef.player.dispatchEvent(event);

        if (this.getVPAID()?.resizeVpaidAuto)
        {
            this.getVPAID().resizeVpaidAuto();
        }
    }

    defaultTheatre(): void
    {
        const videoWrapper = document.getElementById('ww_video_wrapper_' + this.videoPlayerId);

        if (this.theatreMode)
        {
            videoWrapper.classList.remove('ww_theatre_mode');
            videoWrapper.style.maxHeight = '';
            videoWrapper.style.marginTop = '';
            videoWrapper.style.left      = '';
            videoWrapper.style.right     = '';
            videoWrapper.style.position  = '';
            if (!this.displayOptions.layoutControls.fillToContainer)
            {
                videoWrapper.style.width  = this.originalWidth + 'px';
                videoWrapper.style.height = this.originalHeight + 'px';
            }
            else
            {
                videoWrapper.style.width  = '100%';
                videoWrapper.style.height = '100%';
            }
            return;
        }

        videoWrapper.classList.add('ww_theatre_mode');
        const workingWidth           = this.displayOptions.layoutControls.theatreSettings.width;
        let defaultHorizontalMargin  = '10px';
        videoWrapper.style.width     = workingWidth;
        videoWrapper.style.height    = this.displayOptions.layoutControls.theatreSettings.height;
        videoWrapper.style.maxHeight = screen.height + 'px';
        videoWrapper.style.marginTop = this.displayOptions.layoutControls.theatreSettings.marginTop + 'px';
        switch (this.displayOptions.layoutControls.theatreSettings.horizontalAlign)
        {
            case 'center':
                // We must calculate the margin differently based on whether they passed % or px
                if (typeof (workingWidth) == 'string' && workingWidth.substr(workingWidth.length - 1) === '%')
                {
                    // A margin of half the remaining space
                    defaultHorizontalMargin = ((100 - parseInt(workingWidth.substring(0, workingWidth.length - 1))) / 2) + '%';
                }
                else if (typeof (workingWidth) == 'string' && workingWidth.substr(workingWidth.length - 2) === 'px')
                {
                    // Half the (Remaining width / fullwidth)
                    defaultHorizontalMargin = (((screen.width - parseInt(workingWidth.substring(0, workingWidth.length - 2))) / screen.width) * 100 / 2) + '%';
                }
                else
                {
                    console.log('[WWP_ERROR] Theatre width specified invalid.');
                }

                videoWrapper.style.left = defaultHorizontalMargin;
                break;
            case 'right':
                videoWrapper.style.right = defaultHorizontalMargin;
                break;
            case 'left':
            default:
                videoWrapper.style.left = defaultHorizontalMargin;
                break;
        }
    }

    /**
     * Set the poster for the video, taken from custom params
     * Cannot use the standard video tag poster image as it can be removed by the persistent settings
     */
    posterImage(): void
    {
        if (!this.displayOptions.layoutControls.posterImage)
        {
            return;
        }

        const containerDiv     = document.createElement('div');
        containerDiv.id        = this.videoPlayerId + '_ww_pseudo_poster';
        containerDiv.className = 'ww_pseudo_poster';
        if (['auto', 'contain', 'cover'].indexOf(this.displayOptions.layoutControls.posterImageSize) === -1)
        {
            console.log('[WWP_ERROR] Not allowed value in posterImageSize');
            return;
        }
        containerDiv.style.background = 'url(\'' + this.displayOptions.layoutControls.posterImage + '\') center center / '
            + this.displayOptions.layoutControls.posterImageSize + ' no-repeat black';
        this.domRef.player.parentNode.insertBefore(containerDiv, null);
    }

    /**
     * This is called when a media type is unsupported. We'll find the current source and try set the next source if it exists
     */
    nextSource(): void
    {
        const sources = this.domRef.player.getElementsByTagName('source');

        if (!sources.length)
        {
            return null;
        }

        for (let i = 0; i < sources.length - 1; i++)
        {
            if (sources[i].getAttribute('src') === this.originalSrc && sources[i + 1].getAttribute('src'))
            {
                this.setVideoSource(sources[i + 1].getAttribute('src'));
                return;
            }
        }
    }

    inIframe(): boolean
    {
        try
        {
            return window.self !== window.top;
        }
        catch (e)
        {
            return true;
        }
    }

    setPersistentSettings(): boolean
    {
        if (!(typeof (Storage) !== 'undefined' && typeof (localStorage) !== 'undefined'))
        {
            return;
        }

        // See https://github.com/ww-player/ww-player/issues/271
        const testKey = '_fp_storage_enabled', storage = localStorage;
        try
        {
            storage.setItem(testKey, '1');
            storage.removeItem(testKey);
        }
        catch (error)
        {
            return false;
        }

        this.wwStorage = localStorage;
        if (typeof (this.wwStorage.wwVolume) !== 'undefined'
            && this.displayOptions.layoutControls.persistentSettings.volume)
        {
            this.setVolume(this.wwStorage.wwVolume);

            if (typeof (this.wwStorage.wwMute) !== 'undefined' && this.wwStorage.wwMute === 'true')
            {
                this.muteToggle();
            }
        }

        if (typeof (this.wwStorage.wwQuality) !== 'undefined'
            && this.displayOptions.layoutControls.persistentSettings.quality)
        {
            const sourceOption       = document.getElementById('source_' + this.videoPlayerId + '_' + this.wwStorage.wwQuality);
            const sourceChangeButton = document.getElementById(this.videoPlayerId + '_ww_control_video_source');
            if (sourceOption)
            {
                sourceOption.click();
                sourceChangeButton.click();
            }
        }

        if (typeof (this.wwStorage.wwSpeed) !== 'undefined'
            && this.displayOptions.layoutControls.persistentSettings.speed)
        {
            this.setPlaybackSpeed(this.wwStorage.wwSpeed);
        }

        if (typeof (this.wwStorage.wwTheatre) !== 'undefined'
            && this.wwStorage.wwTheatre === 'true'
            && this.displayOptions.layoutControls.persistentSettings.theatre)
        {
            this.theatreToggle();
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ "API" Functions
    // -----------------------------------------------------------------------------------------------------

    play(): boolean
    {
        if (!this.domRef.player.paused)
        {
            return false;
        }
        this.playPauseToggle();
        return true;
    }

    pause(): boolean
    {
        if (!this.domRef.player.paused)
        {
            this.playPauseToggle();
        }
        return true;
    }

    skipTo(time: number): void
    {
        this.domRef.player.currentTime = time;
    }

    setPlaybackSpeed(speed): void
    {
        if (this.isCurrentlyPlayingAd)
        {
            return;
        }
        this.domRef.player.playbackRate = speed;
        this.wwStorage.wwSpeed          = speed;
    }

    setVolume(passedVolume): void
    {
        this.domRef.player.volume = passedVolume;

        // If user scrolls to volume 0, we should not store 0 as
        // latest volume - there is a property called "muted" already
        // and storing 0 will break the toggle.
        // In case user scrolls to 0 we assume last volume to be 1
        // for toggle.
        const latestVolume = 0 === passedVolume ? 1 : passedVolume;

        this.latestVolume       = latestVolume;
        this.wwStorage.wwVolume = latestVolume;
    }

    isCurrentlyPlayingVideo(instance: HTMLVideoElement): boolean
    {
        return instance && instance.currentTime > 0 && !instance.paused && !instance.ended && instance.readyState > 2;
    }

    setHtmlOnPauseBlock(passedHtml: IPassedHtml): void|boolean
    {
        if (typeof passedHtml != 'object' || typeof passedHtml.html == 'undefined')
        {
            return false;
        }

        const htmlBlock = document.getElementById(this.videoPlayerId + '_ww_html_on_pause');

        // We create the HTML block from scratch if it doesn't already exist
        if (!htmlBlock)
        {
            const containerDiv         = document.createElement('div');
            containerDiv.id            = this.videoPlayerId + '_ww_html_on_pause';
            containerDiv.className     = 'ww_html_on_pause';
            containerDiv.style.display = 'none';
            containerDiv.innerHTML     = passedHtml.html;
            containerDiv.onclick       = () =>
            {
                this.playPauseToggle();
            };

            if (passedHtml.width)
            {
                containerDiv.style.width = passedHtml.width + 'px';
            }

            if (passedHtml.height)
            {
                containerDiv.style.height = passedHtml.height + 'px';
            }

            this.domRef.player.parentNode.insertBefore(containerDiv, null);
            return;
        }

        htmlBlock.innerHTML = passedHtml.html;

        if (passedHtml.width)
        {
            htmlBlock.style.width = passedHtml.width + 'px';
        }

        if (passedHtml.height)
        {
            htmlBlock.style.height = passedHtml.height + 'px';
        }
    }

    toggleControlBar(show?: boolean): void
    {
        const controlBar = document.getElementById(this.videoPlayerId + 'ww_controls_container');

        if (show)
        {
            controlBar.className += ' initial_controls_show';
            return;
        }

        controlBar.className = controlBar.className.replace(' initial_controls_show', '');
    }

    on(eventCall: string, functionCall: (...events: any) => any): void
    {
        switch (eventCall)
        {
            case 'play':
                this.domRef.player.onplay = functionCall;
                break;
            case 'seeked':
                this.domRef.player.onseeked = functionCall;
                break;
            case 'ended':
                this.domRef.player.onended = functionCall;
                break;
            case 'pause':
                this.domRef.player.addEventListener('pause', () =>
                {
                    if (!this.wwPseudoPause)
                    {
                        functionCall();
                    }
                });
                break;
            case 'playing':
                this.domRef.player.addEventListener('playing', functionCall);
                break;
            case 'theatreModeOn':
                this.domRef.player.addEventListener('theatreModeOn', functionCall);
                break;
            case 'theatreModeOff':
                this.domRef.player.addEventListener('theatreModeOff', functionCall);
                break;
            case 'timeupdate':
                this.domRef.player.addEventListener('timeupdate', () =>
                {
                    functionCall(this.getCurrentTime())
                });
                break;
            case 'waiting':
                this.domRef.player.addEventListener('waiting', functionCall);
                break;
            case 'loadedmetadata':
                this.domRef.player.addEventListener('loadedmetadata', functionCall);
                break;
            case 'error':
                this.domRef.player.addEventListener('error', functionCall);
                break;
            case 'durationchange':
                this.domRef.player.addEventListener('durationchange', functionCall);
                break;
            default:
                console.log('[WWP_ERROR] Event not recognised');
                break;
        }
    }

    toggleLogo(logo: ILogo): void|boolean
    {
        if (typeof logo != 'object' || !logo.imageUrl)
        {
            return false;
        }

        const logoBlock = document.getElementById(this.videoPlayerId + '_logo');

        // We create the logo from scratch if it doesn't already exist, they might not give everything correctly so we
        this.displayOptions.layoutControls.logo.imageUrl          = (logo.imageUrl) ? logo.imageUrl : null;
        this.displayOptions.layoutControls.logo.position          = (logo.position) ? logo.position : 'top left';
        this.displayOptions.layoutControls.logo.clickUrl          = (logo.clickUrl) ? logo.clickUrl : null;
        this.displayOptions.layoutControls.logo.opacity           = (logo.opacity) ? logo.opacity : 1;
        this.displayOptions.layoutControls.logo.mouseOverImageUrl = (logo.mouseOverImageUrl) ? logo.mouseOverImageUrl : null;
        this.displayOptions.layoutControls.logo.imageMargin       = (logo.imageMargin) ? logo.imageMargin : '2px';
        this.displayOptions.layoutControls.logo.hideWithControls  = (logo.hideWithControls) ? logo.hideWithControls : false;
        this.displayOptions.layoutControls.logo.showOverAds       = (logo.showOverAds) ? logo.showOverAds : false;

        if (logoBlock)
        {
            logoBlock.remove();
        }

        this.initLogo();
    }

    // this functions helps in adding event listeners for future dynamic elements
    // trackEvent(document, "click", ".some_elem", callBackFunction);
    trackEvent(el: Document|HTMLElement|Element|ParentNode, evt: string, sel: string, handler: (...evn) => any): void
    {
        if (typeof this.events[sel] === 'undefined')
        {
            this.events[sel] = {};
        }

        if (typeof this.events[sel][evt] === 'undefined')
        {
            this.events[sel][evt] = [];
        }

        this.events[sel][evt].push(handler);
        this.registerListener(el, evt, sel, handler);
    }

    registerListener(el: Document|HTMLElement|Element|ParentNode, evt: string, sel: string, handler: (...evn) => any): void
    {
        const currentElements = el.querySelectorAll(sel);
        for (let i = 0; i < currentElements.length; i++)
        {
            currentElements[i].addEventListener(evt, handler);
        }
    }

    copyEvents(topLevelEl): void
    {
        for (let sel in this.events)
        {
            if (!this.events.hasOwnProperty(sel))
            {
                continue;
            }

            for (let evt in this.events[sel])
            {
                if (!this.events[sel].hasOwnProperty(evt))
                {
                    continue;
                }

                for (let i = 0; i < this.events[sel][evt].length; i++)
                {
                    this.registerListener(topLevelEl, evt, sel, this.events[sel][evt][i]);
                }
            }
        }
    }

    destroy(): void
    {
        const numDestructors = this.destructors.length;

        if (0 === numDestructors)
        {
            return;
        }

        for (let i = 0; i < numDestructors; ++i)
        {
            this.destructors[i].bind(this)();
        }

        const container = document.getElementById('ww_video_wrapper_' + this.videoPlayerId);

        if (!container)
        {
            console.warn('Unable to remove wrapper element for WW Player instance - element not found ' + this.videoPlayerId);
            return;
        }

        if ('function' === typeof container.remove)
        {
            container.remove();
            return;
        }

        if (container.parentNode)
        {
            container.parentNode.removeChild(container);
            return;
        }

        console.error('Unable to remove wrapper element for WW Player instance - no parent' + this.videoPlayerId);
    }
}

/**
 * Public WW Player API interface
 * @param instance
 */
const wwPlayerInterface = function (instance: Wwplayer)
{
    this.play = () =>
    {
        return instance.play()
    };

    this.pause = () =>
    {
        return instance.pause()
    };

    this.skipTo = (position: number) =>
    {
        return instance.skipTo(position)
    };

    this.setPlaybackSpeed = (speed: number) =>
    {
        return instance.setPlaybackSpeed(speed)
    };

    this.setVolume = (volume: number) =>
    {
        return instance.setVolume(volume)
    };

    this.setHtmlOnPauseBlock = (options: IPassedHtml) =>
    {
        return instance.setHtmlOnPauseBlock(options)
    };

    this.toggleControlBar = (state?: boolean) =>
    {
        return instance.toggleControlBar(state)
    };

    this.toggleFullScreen = (state?: boolean) =>
    {
        return instance.fullscreenToggle(state)
    };

    this.destroy = () =>
    {
        return instance.destroy();
    };

    this.dashInstance = () =>
    {
        return !!instance.dashPlayer ? instance.dashPlayer : null;
    };

    this.hlsInstance = () =>
    {
        return !!instance.hlsPlayer ? instance.hlsPlayer : null;
    };

    this.isCurrentlyPlayingVideo = () =>
    {
        return instance.isCurrentlyPlayingVideo(instance.domRef.player);
    };

    this.toggleLogo = (logo: ILogo): void|boolean =>
    {
        return instance.toggleLogo(logo);
    };

    this.muteToggle = () =>
    {
        return instance.muteToggle();
    };

    this.isMuted = () =>
    {
        return instance.domRef.player.muted;
    };

    this.on = (event: string, callback: (...events: any) => any) =>
    {
        return instance.on(event, callback)
    };
};

/**
 * Initialize and attach WW Player to instance of HTMLVideoElement
 */
const wwPlayerInitializer = function (target: HTMLVideoElement|string|String, options: IDisplayOptions): IWWPlayer
{
    const instance = new Wwplayer();

    if (!options)
    {
        options = {};
    }

    instance.init(target, options);

    const publicInstance = new wwPlayerInterface(instance) as IWWPlayer;

    if (window && WWP_DEVELOPMENT_MODE)
    {
        const debugApi = {
            id       : target,
            options  : options,
            instance : publicInstance,
            internals: instance
        };

        if (typeof (window as any).wwPlayerDebug === 'undefined')
        {
            (window as any).wwPlayerDebug = [];
        }

        (window as any).wwPlayerDebug.push(debugApi);

        console.log('Created instance of WW Player. ' +
            'Debug API available at window.wwPlayerDebug[' + ((window as any).wwPlayerDebug.length - 1) + '].', debugApi);
    }

    return publicInstance;
};


if (WWP_DEVELOPMENT_MODE)
{
    console.log('WW Player - Development Build' + (WWP_RUNTIME_DEBUG ? ' (in debug mode)' : ''));
}

export default wwPlayerInitializer;