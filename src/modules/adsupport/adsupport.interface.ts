export interface IAddSupport
{
    renderLinearAd(adListId, backupTheVideoTime): void;

    playRoll(adListId): void;

    backupMainVideoContentTime(adListId): void;

    getSupportedMediaFileObject(mediaFiles): void;

    getMediaFileTypeSupportLevel(mediaType): void;

    scheduleTrackingEvent(currentTime, duration): void;

    trackSingleEvent(eventType, eventSubType): void;

    completeNonLinearStatic(adListId): void;

    createNonLinearStatic(adListId): void;

    createVpaidNonLinearBoard(adListId): void;

    createNonLinearBoard(adListId): void;

    createBoard(adListId): void;

    closeNonLinear(adListId): void;

    rollGroupContainsLinear(groupedRolls): void;

    rollGroupContainsNonlinear(groupedRolls): void;

    preRollFail(): void;

    preRollSuccess(): void;

    preRollAdsPlay(): void;

    preRoll(event): void;

    createAdMarker(adListId, time): void;

    hideAdMarker(adListId): void;

    showAdMarkers(): void;

    hideAdMarkers(): void;

    midRoll(event): void;

    postRoll(event): void;

    onPauseRoll(event): void;

    hasValidOnPauseAd(): void;

    toggleOnPauseAd(): void;

    trackingOnPauseNonLinearAd(adListId, status): void;

    getLinearAdsFromKeyTime(keyTimeLinearObj): void;

    adKeytimePlay(keyTime): void;

    adTimer(): void;

    scheduleTask(task): void;

    switchToMainVideo(): void;

    getNextAdPod(): void;

    checkForNextAd(): void;

    addSkipButton(): void;

    addAdCountdown(): void;

    decreaseAdCountdown(): void;

    removeAdCountdown(): void;

    toggleAdCountdown(showing): void;

    addAdPlayingText(textToShow): void;

    positionTextElements(adListData): void;

    removeAdPlayingText(): void;

    addCTAButton(landingPage): void;

    removeCTAButton(): void;

    decreaseSkipOffset(): void;

    pressSkipButton(): void;

    removeSkipButton(): void;

    addClickthroughLayer(): void;

    removeClickthrough(): void;
}
