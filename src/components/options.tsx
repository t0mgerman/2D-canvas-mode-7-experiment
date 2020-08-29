import * as React from "react";

import tiles from "../../assets/tiles.jpg";
import mariocircuit from "../../assets/mariocircuit-1.png";
import donutplains from "../../assets/donutplains-3.png";
import linkToThePast from "../../assets/link-to-the-past.jpg";
import pilotwings2 from "../../assets/pilotwings-lesson2.jpg";

import { AppState } from "../app";
import { Settings } from "../app.types";

import styles from "./options.module.scss";

export interface IOptionPresets {
    [index:string]: Settings;
}

export const Options = () => {

    const appState = React.useContext(AppState);
    const {
        backgroundColor,
        currentMap,
        farWidth,
        floorPlaneColor,
        frustumDepth,
        frustumScale,
        horizon,
        loopMap,
        nearWidth,
        resolution,
        updateSettings,
    } = appState;
    
    const presets: IOptionPresets = {};
    presets[linkToThePast] = {"frustumScale":0.215,"rotation":0,"farWidth":0.53,"nearWidth":0.01,"frustumDepth":0.64,"backgroundColor":"#d8dfef","floorPlaneColor":"#d8dfef","loopMap":false,"horizon":0.1,"resolution":2,"origin":[756,1105.775]};
    presets[mariocircuit] = {"frustumScale": 0.085,"rotation":0,"farWidth": 0.4,"nearWidth": 0.09,"frustumDepth": 0.66,"backgroundColor":"#1968ca","floorPlaneColor":"#00a500","loopMap": false,"horizon": 0.3,"resolution":2,"origin":[937.984, 713.984]};
    presets[pilotwings2] = {"frustumScale": 0.085,"rotation":0,"farWidth": 0.4,"nearWidth": 0.09,"frustumDepth": 0.66,"floorPlaneColor":"#48772f","backgroundColor":"#1698ca","loopMap":false,"horizon": 0.3,"origin":[335.544,451.015125]};

    return (
        <div className={styles.options}>
            <select onChange={(e) => {
                if (e.target && updateSettings) {
                    let newState = {...appState};
                    if (presets[e.target.value]) {
                        newState = {...appState, ...presets[e.target.value]};
                    }
                    let _origin = newState.origin ? [newState.origin[0], newState.origin[1]] : undefined;
                    updateSettings({
                        ...newState,
                        currentMap: e.target.value,
                        origin: _origin,
                    });
                }
            }} value={currentMap}>
                <option value="">-- Select a Map --</option>
                <option value={tiles}>Tiles (debug)</option>
                <option value={mariocircuit}>Mario Circuit 1</option>
                <option value={donutplains}>Donut Plains 3</option>
                <option value={linkToThePast}>Link to the Past</option>
                <option value={pilotwings2}>Pilotwings - Lesson 2</option>
            </select>
            <div>
                <label htmlFor="nearWidth">Near Width</label>
                <input 
                    id="nearWidth" type="range" 
                    min="0.01" max="2" step="0.01" 
                    value={nearWidth}
                    onChange={(e) => {
                        if (e.target && updateSettings) {
                            updateSettings({
                                ...appState,
                                nearWidth: parseFloat(e.target.value)
                            });
                        }
                    }}
                />     
            </div>
            <div>
                <label htmlFor="farWidth">Far Width</label>
                <input 
                    id="farWidth" type="range" 
                    min="0.01" max="2" step="0.01" 
                    value={farWidth}
                    onChange={(e) => {
                        if (e.target && updateSettings) {
                            updateSettings({
                                ...appState,
                                farWidth: parseFloat(e.target.value)
                            });
                        }
                    }}
                />     
            </div>
            <div>
                <label htmlFor="frustumDepth">Frustum Depth</label>
                <input 
                    id="frustumDepth" type="range" 
                    min="0.01" max="2" step="0.01" 
                    value={frustumDepth}
                    onChange={(e) => {
                        if (e.target && updateSettings) {
                            updateSettings({
                                ...appState,
                                frustumDepth: parseFloat(e.target.value)
                            });
                        }
                    }}
                />     
            </div>
            <div>
                <label htmlFor="frustumScale">Frustum Scale</label>
                <input 
                    id="frustumScale" type="range" 
                    min="0.005" max="1" step="0.005" 
                    value={frustumScale}
                    onChange={(e) => {
                        if (e.target && updateSettings) {
                            updateSettings({
                                ...appState,
                                frustumScale: parseFloat(e.target.value)
                            });
                        }
                    }}
                />     
            </div>
            <div>
                <label htmlFor="horizonLine">Horizon Line</label>
                <input 
                    id="horizonLine" type="range" 
                    min="0" max="1" step="0.1" 
                    value={horizon}
                    onChange={(e) => {
                        if (e.target && updateSettings) {
                            updateSettings({
                                ...appState,
                                horizon: parseFloat(e.target.value)
                            });
                        }
                    }}
                />     
            </div>
            <div>
                <label htmlFor="resolution">Lower Resolution</label>
                <input 
                    id="resolution" type="range" 
                    min="1" max="10" step="1" 
                    value={resolution}
                    onChange={(e) => {
                        if (e.target && updateSettings) {
                            const resolution = parseInt(e.target.value, 10);
                            
                            updateSettings({
                                ...appState,
                                resolution,
                            });
                        }
                    }}
                />     
            </div>
            <div>
                <label htmlFor="loopMap">Loop Map</label>
                <input type="checkbox"
                    id="loopMap" 
                    checked={loopMap}
                    onChange={(e) => {
                        if (e.target && updateSettings) {
                            updateSettings({
                                ...appState,
                                loopMap: e.target.checked
                            });
                        }
                    }}
                />     
            </div>
            <div>
                <label htmlFor="bgColor">Background Color</label>
                <input type="text"
                    id="bgColor" 
                    value={backgroundColor}
                    onChange={(e) => {
                        if (e.target && updateSettings) {
                            updateSettings({
                                ...appState,
                                backgroundColor: e.target.value
                            });
                        }
                    }}
                />     
            </div>
            <div>
                <label htmlFor="floorColor">Floor Color</label>
                <input type="text"
                    id="floorColor" 
                    value={floorPlaneColor}
                    onChange={(e) => {
                        if (e.target && updateSettings) {
                            updateSettings({
                                ...appState,
                                floorPlaneColor: e.target.value
                            });
                        }
                    }}
                />     
            </div>
            
        </div>
    );
}