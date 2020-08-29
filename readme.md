# Mode 7 Experiment for 2D Canvas

This is an experimental bit of code using `TypeScript` and `React` in an attempt to recreate the Mode 7 graphical effect seen in Super Nintendo games using a `Canvas` element's `2d` context.

It would be possible to create this effect more easily using the `web-gl` context of a Canvas element, or using something like CSS transforms - however, I wanted to try recreating the effect manually, pixel by pixel - and using a 2D Canvas context felt a bit more SNESy in terms of limitations.

I have attempted to comment the code in case anyone wants to take a look, and fair warning - this doesn't really run properly in IE (it crashes it, in fact) - but this is just a bit of time-wasting fun really. 

`React` is only used for synching the tweaked parameters back to app-state, it's not really necessary, the same could be acheived with normal event handlers, and I've only used `TypeScript` because I really like it 😊 it could have easily been plain JavaScript.

## Method

The SNES created this effect using `affine transforms` (translation, scaling and shearing), and used HDMA to scale the texture up for each scanline. `Retro Game Mechanics Explained` have a great video on how this was done here:

https://www.youtube.com/watch?v=3FVN_Ze7bzw

This code uses a slightly different technique, similar to what `javidx9` uses in this video:

https://www.youtube.com/watch?v=ybLZyY655iY

## Building / Running

Clone the repo, run `npm install` to get dependencies - then run `npm run serve` to host a dev build with `webpack-dev-server`

Controls are `W`,`A`,`S`,`D` for movement and `Shift` to accelerate.