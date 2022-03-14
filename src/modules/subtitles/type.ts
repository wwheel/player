export interface ISubtitles
{
    subtitleFetchParse?(subtitleItem): void;
    createSubtitlesSwitch?(): void;
    renderSubtitles?(): void;
    openCloseSubtitlesSwitch?(): void;
    createSubtitles?(): void;
}