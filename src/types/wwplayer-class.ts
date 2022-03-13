import { IDisplayOptions, IVastOptions } from './display-options';
import { ICustomControlTags } from './custom-control-tags';

export interface IWWPlayerClass
{
    videoPlayerId: string;
    vastOptions: IVastOptions;
    timerPool: {[key: string]: any};
    adList: {[key: string]: any};
    adPool: {[key: string]: any};
    adGroupedByRolls: {[key: string]: any};
    domRef: {
        player: HTMLVideoElement;
        wrapper?: HTMLElement;
        controls?: ICustomControlTags;
    };
    vpaidAdUnit: any;
    fullscreenMode: boolean;
    displayOptions: IDisplayOptions;
    adFinished: boolean;
    toggleLoader(showLoader: boolean): void;
    switchPlayerToVpaidMode(adListId: string): void;
    debugMessage(msg: string): void;
    compareVersion(v1, v2): number|boolean;
    playMainVideoWhenVpaidFails(errorCode): void;
    addSkipButton(): void;
    vpaidCallbackListenersAttach(): void;
}
