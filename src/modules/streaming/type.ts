export interface IStreaming
{
    initialiseStreamers?(): Promise<void>;
    initialiseDash?(): void;
    initialiseHls?(): void;
    detachStreamers?(): void;
}