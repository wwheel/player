export interface ITheatreSettings
{
  width: string;
  height: string;
  marginTop: number;
  horizontalAlign: string;
  keepPosition: boolean;
}

export interface ILogo
{
  imageUrl: string;
  position: string;
  clickUrl: string;
  opacity: number;
  mouseOverImageUrl: string;
  imageMargin: string;
  hideWithControls: boolean;
  showOverAds: boolean;
}

export interface IControlBar
{
  autoHide: boolean;
  autoHideTimeout: number;
  animated: boolean;
}

export interface ITimelinePreview
{
  spriteImage: boolean;
  spriteRelativePath: boolean;
}

export interface IHtmlOnPauseBlock
{
  html: string;
  height: string|number;
  width: string|number;
}

export interface IPersistentSettings
{
  volume: boolean;
  quality: boolean;
  speed: boolean;
  theatre: boolean;
}

export interface IControlForwardBackward
{
  show: boolean;
}

export interface IContextMenu
{
  controls: boolean;
  links: {href: string, label: string}[]
}

export interface ILayoutControls
{
  mediaType: string;
  primaryColor: boolean;
  posterImage: boolean;
  posterImageSize: string;
  adProgressColor: string;
  playButtonShowing: boolean;
  playPauseAnimation: boolean;
  closeButtonCaption: string;
  fillToContainer: boolean;
  autoPlay: boolean;
  preload: string;
  mute: boolean;
  loop: boolean;
  keyboardControl: boolean;
  allowDownload: boolean;
  playbackRateEnabled: boolean;
  subtitlesEnabled: boolean;
  showCardBoardView: boolean;
  showCardBoardJoystick: boolean;
  allowTheatre: boolean;
  doubleclickFullscreen: boolean;
  theatreAdvanced: boolean;
  title: string;
  layout: string;
  playerInitCallback: () => void;
  theatreSettings: ITheatreSettings;
  logo: ILogo;
  controlBar: IControlBar;
  timelinePreview: ITimelinePreview;
  htmlOnPauseBlock: IHtmlOnPauseBlock;
  persistentSettings: IPersistentSettings;
  controlForwardBackward: IControlForwardBackward;
  contextMenu: IContextMenu;
}

export interface IVastOptions
{
  adList: any;
  skipButtonCaption: string;
  skipButtonClickCaption: string;
  adText: string;
  adTextPosition: string;
  adCTAText: string;
  adCTATextPosition: string;
  adClickable: boolean;
  vastTimeout: number;
  showProgressbarMarkers: boolean;
  allowVPAID: boolean;
  showPlayButton: boolean;
  maxAllowedVastTagRedirects: number;
  vpaidTimeout: number;
  vastAdvanced: {
    vastLoadedCallback: () => void;
    noVastVideoCallback: () => void;
    vastVideoSkippedCallback: () => void;
    vastVideoEndedCallback: () => void;
  }
}

export interface ICaptions
{
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  fullscreen: string;
  subtitles: string;
  exitFullscreen: string;
}

export interface IModules
{
  configureHls: (options) => any;
  onBeforeInitHls: (hls) => void;
  onAfterInitHls: (hls) => void;
  configureDash: (options) => any;
  onBeforeInitDash: (dash) => void;
  onAfterInitDash: (dash) => void;
}

export interface IDisplayOptions
{
  layoutControls: ILayoutControls;
  vastOptions: IVastOptions;
  captions: ICaptions;
  debug: boolean;
  modules: IModules;
  onBeforeXMLHttpRequestOpen: (request) => void;
  onBeforeXMLHttpRequest    : (request) => void;
}
