export interface ICanAutoplayOptions
{
    inline?: boolean;
    muted?: boolean;
    timeout?: number;
}

export interface ICanAutoplayResult
{
    result: boolean;
    error?: Error;
}

export interface ICanAutoplay
{
    canAutoplay?(): Promise<ICanAutoplayResult>
}