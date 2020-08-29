import React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./app";

const container = document.getElementById('app');
if (container) {
    const appControl = React.createElement(App);
    ReactDOM.render(appControl, container);
}