import React from "react";
import { Options } from "./components/options";

import { 
    degreesToRadians, 
    getInterpolatedPoint,
    radiansToVector,
    hexToRgbA
} from "./utils";

import { 
    IAppState ,
    initialAppState, 
    Settings
} from "./app.types";

import styles from "./styles.scss";

/** AppState context - descendents of this component can consume this state obj */
export const AppState = React.createContext<IAppState>(initialAppState);

export class App extends React.Component<{},IAppState> {

    private _currentMap: CanvasImageSource | null = null;
    private _previewContext: CanvasRenderingContext2D | null = null;
    private _screenContext: CanvasRenderingContext2D | null = null;
    
    /** _mouseNavigating is true when user is dragging in the preview window */
    private _mouseNavigating: boolean = false;

    // defaults
    private _nativeWidth = 256;
    private _nativeHeight = 224;
    private _resolution = {
        width: 256, height: 224
    };

    /** Level of the horizon as a float / percentage (0 to 1) */
    private _horizon: number = 0.5;

    /** Position of camera frustum */
    private _origin: number[] = [0,0]; 

    /** Stores currently-pressed keys */
    private _keyDownArr: string[] = [];

    /** Rotation of camera */
    private _rotation = 0;

    /** Heading direction of camera */
    private _headingVector: number[] = [0,0];
    
    /** Floor plane colour as RGBA array */
    private _floorplaneRgba = [0,0,0,255];

    /** Time in milliseconds of last updated frame */
    private _delta: number = Date.now();

    constructor(props: {}) {
        super(props);

        // Fn bindings - ensures 'this' is this component class
        this._draw = this._draw.bind(this);
        this._initCanvas = this._initCanvas.bind(this);
        this._onPreviewMouseOver = this._onPreviewMouseOver.bind(this);
        this._keyEventHandler = this._keyEventHandler.bind(this);
        this._updateSettings = this._updateSettings.bind(this);
        
        // init state
        this.state = {
            ...initialAppState,
            updateSettings: this._updateSettings
        };
    }

    public componentDidMount() {

        // key bindings
        document.addEventListener('keyup', this._keyEventHandler);
        document.addEventListener('keydown', this._keyEventHandler);
        
        // initialise pseudo canvas
        this._initCanvas();
        window.addEventListener("resize", this._initCanvas);

        // initialise draw loop
        window.requestAnimationFrame(this._draw);

    }

    public componentWillUnmount() {

        // remove key bindings
        document.removeEventListener('keyup', this._keyEventHandler);
        document.removeEventListener('keydown', this._keyEventHandler);

    }

    public componentDidUpdate(prevProps: {}, prevState: IAppState) {
        
        let { backgroundColor, currentMap, floorPlaneColor, horizon, origin, resolution, rotation } = this.state;
        if (horizon !== undefined) this._horizon = horizon;

        // if selected image / map has changed...
        if (currentMap && currentMap !== prevState.currentMap) {
            // load new map
            const image = new Image();
            image.src = currentMap;
            image.onload = () => {
                // when loaded

                this._currentMap = image;

                /*  Vars like origin / camera position and rotation are handled internally
                    to this class

                    The equivalent vars in state are used to allow external components to 
                    change them. For example, some maps when selected apply some 'presets'
                    These are applied here...
                */
                if (origin === undefined) {
                    this._origin = [ this._currentMap.width / 2, this._currentMap.height / 2 ];
                } else {
                    this._origin = origin;
                }
                if (rotation !== undefined) {
                    this._rotation = rotation;
                }

                // Set state.origin back to undefined so above doesn't happen recurringly
                origin = undefined;
                this.setState({
                    ...this.state,
                    origin,
                }, () => {
                    document.getElementById('preview')?.focus();
                });
            };
        }
        // If the user changes the floor plane color, store it as [r,g,b,a] so we can
        // avoid doing this calc during the draw loop
        if (floorPlaneColor && floorPlaneColor !== prevState.floorPlaneColor) {
            this._floorplaneRgba = hexToRgbA(floorPlaneColor);
            // Alpha / opacity comes back from this method as a value between 0 and 1
            // but our code expects a value between 0 and 255
            this._floorplaneRgba[3] *= 255; 
        }
        // If the user changes the resolution slider, calculate the new width and height
        // if (resolution && resolution !== prevState.resolution) {
        //     let i = 1;
        //     while (i < resolution) {
        //         i *= 2;
        //     }
        //     this._resolution = {
        //         width: this._nativeWidth * i, 
        //         height: this._nativeHeight * i
        //     };
        //     this._initCanvas();
        // }

    }

    public render() {

        return (
            <AppState.Provider value={this.state}>
                <div className={styles.title}><span className={styles.m7}>Mode 7</span> Experiment</div>
                <div className={styles.instructions}>Change parameters using the options below. Use W,A,S,D to move - hold shift to increase speed.</div>
                <div className={styles.root}>
                    <div className={styles.opts}>
                        <canvas id="preview" className={styles.preview} width="250" height="250"
                            tabIndex={-1}
                            onMouseDown={() => this._mouseNavigating = true }
                            onMouseUp={() => this._mouseNavigating = false }
                            onMouseMove={this._onPreviewMouseOver}
                        />
                        <Options />
                        <p>Origin (p): { this._calcPreviewOrigin().toString() }</p>
                        <p>Origin: { this._origin?.map((p) => p.toFixed(2)).toString() }</p>
                    </div>
                    <div id="screenContainer" className={styles.canvasContainer}>
                    </div>
                </div>
                <div id="fullscale"  className={styles.fullScale}>
                </div>
            </AppState.Provider>   
        );

    }

    /** Initialises the canvas objects when component loads and on screen resize */
    private _initCanvas() {

        // preview window
        if (!this._previewContext) {
            const preview = document.getElementById('preview') as HTMLCanvasElement;
            this._previewContext = preview.getContext('2d');
        }

        // psuedo 3d canvas
        const screenContainer = document.getElementById('screenContainer') as HTMLDivElement;
        screenContainer.innerHTML = '';
        const screen = document.createElement('canvas');
        screen.id = "screen";
        screen.width = this._nativeWidth;
        screen.height = this._nativeHeight;
        screenContainer.appendChild(screen);
        this._screenContext = screen.getContext('2d');
        if (this._screenContext) {
            this._screenContext.imageSmoothingEnabled = false;
        }

        // this._dpiAdjust();
    }

    /** The draw loop */
    private _draw() {
        const newDelta = Date.now();
        const deltaTime = (newDelta / 100) - (this._delta / 100);
        
        this._processKeyInputs(deltaTime);
        
        if (this._previewContext && this._currentMap) {
            this._drawPreview(this._previewContext, this._currentMap as HTMLImageElement);
        }
        if (this._screenContext && this._currentMap) {
            this._draw3DView(this._screenContext, this._currentMap as HTMLImageElement);
        }
        
        this._delta = newDelta;
        window.requestAnimationFrame(this._draw);
    }

    /** Given a Canvas context and some bounds, draws the outline of a camera frustum */
    private _drawFrustum(context: CanvasRenderingContext2D, bounds: number[][]) {

        if (context) {
            context.beginPath();
            context.moveTo(bounds[0][0], bounds[0][1]);
            context.lineTo(bounds[1][0], bounds[1][1]);
            context.lineTo(bounds[2][0], bounds[2][1]);
            context.lineTo(bounds[3][0], bounds[3][1]);
            context.closePath();
            context.stroke();
        }

    }

    /** Handles the rendering of the map preview */
    private _drawPreview(context: CanvasRenderingContext2D, currentMap: HTMLImageElement) {
        const preview = context.canvas;
        const previewScale = 250 / (currentMap.width as number);
        preview.height = currentMap.height as number * previewScale;
        context.clearRect(0, 0, preview.width, preview.height);
        context.drawImage(currentMap, 0, 0, preview.width, preview.height);

        let bounds = this._calculateCameraFrustum(previewScale);
        bounds = this._rotateCameraFrustum(bounds, true);
        this._drawFrustum(context, bounds);
    }

    /** Interprets the dimensions of the camera frustum, using them to render a psuedo 3d mode-7-like view */
    private _draw3DView(screenCtx: CanvasRenderingContext2D, currentMap: HTMLImageElement) {
        
        const { backgroundColor, floorPlaneColor, loopMap, resolution } = this.state;

        // draw image in memory at full image dimensions
        const memCanvas = document.createElement('canvas') as HTMLCanvasElement;
        const mapWidth = memCanvas.width = currentMap.width as number;
        const mapHeight = memCanvas.height = currentMap.height as number;
        
        const horizon = Math.ceil(mapHeight * this._horizon);
        
        // Uncomment below to view full size map version of preview
        // const debugContainer = document.getElementById('fullscale') as HTMLDivElement;
        //     debugContainer.innerHTML = '';
        //     debugContainer.appendChild(memCanvas); 
        
        const inMemCtx = memCanvas.getContext('2d');
        if (inMemCtx) {

            // draw full map to off-screen canvas (used to sample map texture)
            inMemCtx.fillStyle = backgroundColor;
            inMemCtx.fillRect(0, 0, inMemCtx.canvas.width, inMemCtx.canvas.height);
            inMemCtx.drawImage(currentMap, 0, 0, memCanvas.width, memCanvas.height);
            
            // clear 'screen' canvas and set bg color
            screenCtx.clearRect(0, 0, screenCtx.canvas.width, screenCtx.canvas.height);
            screenCtx.fillStyle = backgroundColor;
            screenCtx.fillRect(0, 0, screenCtx.canvas.width, screenCtx.canvas.height);

            // calculate a frustum relative to full map/image resolution
            let cameraFrustum = this._calculateCameraFrustum(1);
            cameraFrustum = this._rotateCameraFrustum(cameraFrustum);
            const farLeft = cameraFrustum[0], 
                    farRight = cameraFrustum[1], 
                    nearRight = cameraFrustum[2], 
                    nearLeft = cameraFrustum[3];
    
            // variables used for scaling native resolution to size of full canvas
            const scaleX = this._nativeWidth / mapWidth, scaleY = this._nativeHeight / mapHeight;
            const res = resolution || 1;
            
            // at native resolution one pixel of sample data is represented as [r,g,b,a]
            // if we 'lower' the resolution by increasing the 'res' number (the number of pixels
            // drawn for each pixel of native resolution) we need to store more of this data...
            
            // Data for pixels larger than 1x1 is stored as [r,g,b,a, r,g,b,a, r,g,b,a...]  
            // and so on, for the total number of pixels.
            
            // We can calculate the necessary length of this array as 4 * Math.pow(2, res) 
            //    4 values (rgba) * (res pixels wide x res pixels high)
            // but this is slower in javascript than arriving at the value with a loop 

            let resImgDataLen = res;
            for (let i = 0; i <= res; i++) {
                resImgDataLen *= 2;
            }
            const horizonYPos = mapHeight - horizon;
            
            // The render first goes from y = horizon to the full mapHeight at a rate of <1 native Y pixel scaled to full map height>
            // Within that loop it then goes from x=0 to the full mapWidth at a rate of <1 native X pixel scaled to full map width>
            // By manipulating the resolution (res) variable the image can be made more blocky, resembling the mosaic transition effect
            // used in some SNES games

            // from the horizon to the bottom of the map
            for (let i = 0; i <= horizonYPos; i = i + (res / scaleY)) {
                
                let perc = i / horizonYPos;

                // calculate the position of this scanline on the left and right 
                // edges of the camera frustum
                let leftEdge = getInterpolatedPoint(farLeft, nearLeft, perc, true);
                let rightEdge = getInterpolatedPoint(farRight, nearRight, perc, true);

                // from x = 0 to the full mapWidth
                for (let x = 0; x <= mapWidth; x = x + (res / scaleX)) {
                    
                    const y = i + horizon;

                    // only sample and draw if the target pixel is within the bounds of the map
                    if (x >= 0 && x <= mapWidth && y >= 0 && y <= mapHeight) {

                        let xPerc = x / mapWidth;
    
                        // calculate the sample point
                        let samplePoint = [...getInterpolatedPoint(leftEdge, rightEdge, xPerc)];
                        
                        // prepare to wrap the texture if point is out of bounds
                        if (loopMap) {
                            // check if the current sample points are outside the bounds of the map
                            // and if so store the remaining width/height (when modulus'd against the map dimensions)
                            const rW = samplePoint[0] % mapWidth; 
                            const rH = samplePoint[1] % mapHeight;
                            if (samplePoint[0] < 0) {
                                samplePoint[0] = mapWidth + rW;
                            }
                            if (samplePoint[0] > mapWidth) {
                                samplePoint[0] = rW;
                            }
                            if (samplePoint[1] < 0) {
                                samplePoint[1] = mapHeight + rH;
                            }
                            if (samplePoint[1] > mapHeight) {
                                samplePoint[1] = rH;
                            }
                        }
                        
                        // sample pixel
                        let sample = inMemCtx.getImageData(samplePoint[0], samplePoint[1], 1, 1);

                        // if resolution lowered using slider, multiply the pixel data
                        if (res > 1) {
                            const col = [...sample.data];
                            sample = inMemCtx.createImageData(res,res);
                            for (let p = 0; p < resImgDataLen; p += 4) {
                                col.forEach((c, i) => {
                                    sample.data[i + p] = c;
                                });
                            }
                        }
            
                        // if sampled pixel is not transparent, it's something we should draw
                        if (y !== horizon && sample?.data[3] !== 0) {
                            screenCtx.putImageData(sample, (x * scaleX), (y * scaleY));
                        } else {
                            // otherwise we want to draw the user-selected floor-plane-color
                            if (floorPlaneColor) {
                                const floorPixel = screenCtx.createImageData(res,res);

                                for (let p = 0; p < (res == 1 ? res : resImgDataLen); p += 4) {
                                    this._floorplaneRgba.forEach((c,i,v) => {
                                        floorPixel.data[i + p] = i == 3 ? c * 255 : c;
                                    });
                                }
                                screenCtx.putImageData(floorPixel, x * scaleX, y * scaleY);
                            }
                        }

                    }
                }
            }

            this._drawFrustum(inMemCtx, cameraFrustum);
        }
    }

    /** Given a percentage (scale) calculates the coordinates for a camera frustum
     * based on internal this._origin variable
     */
    private _calculateCameraFrustum(scale: number) {

        const { farWidth, frustumDepth, frustumScale, nearWidth } = this.state;
        
        if (this._currentMap) {
            let x = this._origin[0], y = this._origin[1];

            // scale the frustum relative to the width and height of the map
            let width = this._currentMap ? this._currentMap.width as number : 250;
            let height = this._currentMap ? this._currentMap.height as number : 250;
            if (scale < 1) {
                x = x - width / 2;
                y = y - height / 2;
                x *= scale; y *= scale;
                width = width * scale; height = height * scale;
                x = x + width / 2;
                y = y + height / 2;
            }
            
            const coords = [
                // Far
                [ 
                    x - (((width * frustumScale)) * farWidth),
                    y - (((height * frustumScale)) * frustumDepth),
                ],
                [
                    x + (((width * frustumScale)) * farWidth),
                    y - (((height * frustumScale)) * frustumDepth),
                ],
                // Near
                [ 
                    x + (((width * frustumScale) / 2) * nearWidth),
                    y,
                ],
                [
                    x - (((height * frustumScale) / 2) * nearWidth),
                    y,
                ],
            ];
            return coords;
        } else {
            return [...Array(4)].map(() => [0,0]);
        }
    }

    /** Rotates the camera frustum coordinates */
    private _rotateCameraFrustum(bounds: number[][], preview?: boolean) {
        let origin = this._origin;

        // the frustrum rendered in the preview window is at a different
        // scale, so we need to get the scaled down origin coords
        if (preview) {
            origin = this._calcPreviewOrigin();
        }

        // if rotation var is 0 no rotation required
        if (this._rotation === 0) return bounds;

        const radians = degreesToRadians(this._rotation);
        
        // translate frustrum so origin at 0,0
        let newBounds: number[][] = [];
        bounds.forEach((point) => {
            if (origin) {
                newBounds.push([
                    point[0] - origin[0],
                    point[1] - origin[1]
                ]);
            }
        });

        // perform rotation and translate back to origin
        for (let i = 0; i < newBounds.length; i++) {
            if (origin) {
                const point = newBounds[i];
                const x = point[0], y = point[1];
                newBounds[i] = [
                    (x * Math.cos(radians) - y * Math.sin(radians)) + origin[0],
                    (x * Math.sin(radians) + y * Math.cos(radians)) + origin[1]
                ];
            }
        }        
        return newBounds;

    }

    /** Calculates the scaled-down origin/camera position for the preview window */
    private _calcPreviewOrigin() {
        if (this._currentMap && this._previewContext) {
            const scale = this._previewContext.canvas.width / (this._currentMap.width as number);
            return this._origin.map((p) => parseFloat((p * scale).toFixed(2)));
        } else {
            return [125, 125];
        }
    }

    private _dpiAdjust() {
        if (this._screenContext) {
            const dpi = window.devicePixelRatio;
            const ctx = this._screenContext;
            const canvas = ctx.canvas;
            const width = getComputedStyle(canvas).getPropertyValue('width').slice(0, -2);
            const height = getComputedStyle(canvas).getPropertyValue('height').slice(0, -2);
            canvas.height = parseFloat(height) * dpi;
            canvas.width = parseFloat(width) * dpi;
        }
    }

    /** Stores pressed keys in internal array and blocks some default behaviour */
    private _keyEventHandler(e: KeyboardEvent) {
    
        if (e.type === "keydown" && this._keyDownArr.indexOf(e.key.toUpperCase()) === -1) {
            this._keyDownArr.push(e.key.toUpperCase());
        }
        if (e.type === "keyup" && this._keyDownArr.indexOf(e.key.toUpperCase()) > -1) {
            this._keyDownArr = this._keyDownArr.filter((k) => k !== e.key.toUpperCase());
        }
    
    }

    /** Called at the start of the draw loop. 
     *  Processes the list of keyboard inputs before drawing begins. */
    private _processKeyInputs(deltaTime: number) {
        
        // speed modifier
        let increaseSpeed = false;
        if (this._keyDownArr.indexOf("SHIFT") > -1) {
            increaseSpeed = true;
        }

        // turning / rotation
        if (this._keyDownArr.indexOf("A") > -1) {
            this._rotation += deltaTime * -5;
        }
        if (this._keyDownArr.indexOf("D") > -1) {
            this._rotation += deltaTime * 5;
        }
        if (this._rotation < 0) this._rotation = 360 + this._rotation;
        if (this._rotation > 360) this._rotation = this._rotation - 360;
        if (this._keyDownArr.indexOf("D") > -1) {
            console.log(this._rotation);
        }

        // heading calc and forwards / backwards control
        this._headingVector = radiansToVector(degreesToRadians(this._rotation + 90));
        this._headingTranslate = 0;
        if (this._keyDownArr.indexOf("W") > -1) {
            this._headingTranslate += deltaTime * -5;
        }
        if (this._keyDownArr.indexOf("S") > -1) {
            this._headingTranslate += deltaTime * 5;
        }
        if (increaseSpeed) this._headingTranslate *= 4;
        if (this._headingTranslate !== 0) {
            this._origin = [
                this._origin[0] + (this._headingVector[0] * this._headingTranslate),
                this._origin[1] + (this._headingVector[1] * this._headingTranslate)
            ];
        }

    }

    /** Handles the MouseOver event for the preview window */
    private _onPreviewMouseOver(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
        
        if (this._previewContext && this._currentMap && this._mouseNavigating) {
            const canvas = this._previewContext.canvas;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // scale up x and y to match scale of actual map texture
            const scale = canvas.width / (this._currentMap.width as number);
            this._origin = [x / scale,y / scale];
        }

    }

    /** Used by AppState to allow child components to set various options */
    private _updateSettings(settings: Settings) {
        this.setState({
            ...this.state,
            ...settings,
        });
    }
}