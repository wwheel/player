import { IPassedHtml } from './passed-html';
import { ILogo } from './display-options';

export interface IWWPlayer
{
    play(): boolean;
    pause(): boolean;
    skipTo(position: number): void;
    setPlaybackSpeed(speed: number): void;
    setVolume(volume: number): void;
    setHtmlOnPauseBlock(options: IPassedHtml): void;
    toggleControlBar(state?: boolean): void;
    toggleFullScreen(state?: boolean): void;
    destroy(): void;
    dashInstance<T>(): T|null;
    hlsInstance<T>(): T|null;
    on(event: string, callback: (...events: any) => any): void;
    toggleLogo(logo: ILogo): void|boolean;
    isCurrentlyPlayingVideo(): boolean;
    muteToggle(): void;
    isMuted(): boolean;
}
