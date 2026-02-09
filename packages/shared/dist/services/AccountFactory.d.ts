interface AccountRequest {
    proxy: string;
    baseEmail: string;
    firstName?: string;
    lastName?: string;
    textVerifiedApiKey: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    password?: string;
}
interface CreateOptions {
    onProgress?: (stage: string) => void;
    onLog?: (message: string) => void;
    onScreenshot?: (base64: string) => void;
    onManualState?: (paused: boolean) => void;
}
export declare class AccountFactory {
    private page;
    private browser;
    private static instances;
    static getInstance(sessionId: string): AccountFactory | undefined;
    private options?;
    private currentStepName;
    private isManualControl;
    private log;
    private progress;
    private capture;
    private waitWhilePaused;
    toggleManual(): void;
    handleRemoteClick(x: number, y: number): Promise<void>;
    handleRemoteScroll(deltaY: number): Promise<void>;
    handleRemoteKey(key: string): Promise<void>;
    private findLearnedSelector;
    private smartClick;
    private firstNames;
    private lastNames;
    createBot(req: AccountRequest & {
        sessionId?: string;
    }, options?: CreateOptions): Promise<void>;
    private clickButtonByText;
    private checkForBotTrap;
    private humanNoise;
    private humanDelay;
    private getRandom;
    private currentMouse;
    private cubicBezier;
    humanMoveTo(targetX: number, targetY: number): Promise<void>;
    humanScrollTo(selector: string): Promise<void>;
    private humanType;
    private clearInput;
}
export {};
