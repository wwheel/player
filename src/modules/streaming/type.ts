export interface IStreaming
{
    initialiseStreamers(): void;
    initialiseDash(): void;
    initialiseHls(): void;
    detachStreamers(): void;
}