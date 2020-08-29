export type Point = number[];

export interface Settings {
    currentMap?: string;
    origin?: Point; // X and Y
    frustumScale: number;
    rotation: number;
    nearWidth: number;
    farWidth: number;
    frustumDepth: number;
    loopMap: boolean;
    backgroundColor: string;
    floorPlaneColor: string;
    horizon: number;
    resolution?: number;
}

export interface IAppState extends Settings {
    updateSettings?: (settings: Settings) => void;
}

export const initialAppState: IAppState = {
    currentMap: undefined,
    origin: [0,0],
    frustumScale: .085,
    rotation: 0,
    farWidth: 0.4,
    nearWidth: 0.09,
    frustumDepth: 0.66,
    backgroundColor: "#000",
    floorPlaneColor: "#000",
    loopMap: true,
    horizon: 0.5,
    resolution: 1,
};