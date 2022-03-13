import { MediaFileItem } from '../../types/media-file-item';

export interface IVast
{
    getClickThroughUrlFromLinear(linear): boolean;
    getVastAdTagUriFromWrapper(xmlResponse): boolean;
    hasInLine(xmlResponse): boolean;
    hasVastAdTagUri(xmlResponse): boolean;
    getClickThroughUrlFromNonLinear(nonLinear): string;
    getTrackingFromLinear(linear): any[];
    getDurationFromLinear(linear): boolean;
    getDurationFromNonLinear(tag): number;
    getDimensionFromNonLinear(tag): {width: string|number, height: string|number};
    getCreativeTypeFromStaticResources(tag): string;
    getMediaFilesFromLinear(linear): any[];
    getStaticResourcesFromNonLinear(linear): any[];
    extractNodeData(parentNode): string;
    getAdParametersFromLinear(linear): any;
    getMediaFileListFromLinear(linear): MediaFileItem[];
    getIconClickThroughFromLinear(linear): string;
    getStaticResourceFromNonLinear(linear): any;
    registerTrackingEvents(creativeLinear, tmpOptions): void;
    registerClickTracking(clickTrackingTag, tmpOptions): void;
    registerImpressionEvents(impressionTags, tmpOptions): void;
    registerErrorEvents(errorTags, tmpOptions): void;
    announceError(code): void;
    getClickTrackingEvents(linear): any[];
    getNonLinearClickTrackingEvents(nonLinear): any[];
    callUris(uris: string[]): void;
    recalculateAdDimensions(): void;
    prepareVast(roll): void;
    playMainVideoWhenVastFails(errorCode: number|string): void;
    switchPlayerToVastMode(): void;
    processVastXml(xmlResponse, tmpOptions, callBack): void;
    processVastWithRetries(vastObj): void;
    processUrl(vastTag, callBack): void;
    resolveVastTag(vastTag, numberOfRedirects, tmpOptions, callBack): void;
    setVastList(): void;
    onVastAdEnded(event): void;
    vastLogoBehaviour(vastPlaying: boolean): void;
    deleteVastAdElements(): void;
}