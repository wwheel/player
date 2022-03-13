export interface IUtils
{
    isTouchDevice?(): boolean;
    getMobileOs?(): { device: string, userOs: string, userOsVer: string, userOsMajor: string };
    getBrowserVersion?(): { browserName: string, fullVersion: string, majorVersion: string, userOsMajor: string };
    compareVersion?(v1, v2): boolean|number;
    convertTimeStringToSeconds?(str: string): number;
    formatTime?(duration: number): string;
    pad?(value: number): string|number;
}