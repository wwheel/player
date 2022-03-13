export interface ITimeline
{
    setupThumbnailPreviewVtt(): void;
    generateTimelinePreviewTags(): void;
    getThumbnailCoordinates(second: number): void;
    drawTimelinePreview(event): void;
    setupThumbnailPreview(): void;
}