export interface ICardboard
{
    createCardboardJoystickButton?(identity: string): HTMLButtonElement;

    cardboardRotateLeftRight?(param: number): void;

    cardboardRotateUpDown?(param: number): void;

    createCardboardJoystick?(): void;

    cardBoardResize?(): void;

    cardBoardSwitchToNormal?(): void;

    cardBoardHideDefaultControls?(): void;

    cardBoardCreateVRControls?(): void;

    cardBoardSwitchToVR?(): void;

    cardBoardMoveTimeInfo?(): void;

    cardBoardAlterDefaultControls?(): void;

    createCardboardView?(): void;

    createCardboard?(): void;
}