// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

import {reparametrizedCSF, remesh, clean} from './flow.js';
import {renderClosedCurve, renderPath} from './graphics.js';
import {scale,curvature,add,subtract,squaredLength} from './geometry.js';
import {CircularList} from './CircularList.js';
import {LitElement, html} from '@polymer/lit-element';

const d2 = (a,b) => squaredLength(subtract(a,b));
const dt = 1;

// Helper method for handling mouse and touch using the same functions
// TODO: are native pointerEvents mature yet?
function eachTouch(handler, self=false) {
    if (self) handler = handler.bind(self);
    return (e) => {
        const touchEvents = e.changedTouches
            || (e.originalEvent && e.originalEvent.changedTouches);
        if (touchEvents) {
            for (let e of touchEvents) handler(e);
            e.preventDefault();
        }
        else {
            // TODO: create a real Touch object instead?
            e.identifier = '__mouse__';
            handler(e);
        }
    };
}

class CSFApp extends LitElement {
    constructor() {
        super();
        this.touchPaths = new Map();
        this.curves = [];
    }

    static get properties() {
        return {
            bufferWidth: { type: Number },
            bufferHeight: { type: Number },
        }
    }

    render() {
        return html`
            <style>
                canvas {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                }
            </style>
            <canvas width=${this.bufferWidth}
                    height=${this.bufferHeight}
                    @mousemove=${eachTouch(this.touchMove)}
                    @touchmove=${eachTouch(this.touchMove)}
                    @mousedown=${eachTouch(this.touchStart)}
                    @touchstart=${eachTouch(this.touchStart)}
                    @mouseup=${eachTouch(this.touchEnd)}
                    @touchend=${eachTouch(this.touchEnd)}
                    @selectstart=${() => false}
                ></canvas>
        `;
    }

    get canvas() {
        return this.shadowRoot.querySelector('canvas');
    }

    firstUpdated() {
        window.addEventListener('resize', this.resize);
        window.addEventListener('orientationchange', this.resize);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.tick();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('resize', this.resize);
        window.removeEventListener('orientationchange', this.resize);
    }

    resize = () => {
        // Make sure 1 canvas pixel = 1 screen pixel
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;
        const bsr = ctx.webkitBackingStorePixelRatio 
            ||  ctx.mozBackingStorePixelRatio
            ||  ctx.msBackingStorePixelRatio
            ||  ctx.oBackingStorePixelRatio
            ||  ctx.backingStorePixelRatio || 1;
        const PIXEL_RATIO = dpr/bsr;

        this.bufferWidth    = this.canvas.clientWidth * PIXEL_RATIO;
        this.bufferHeight   = this.canvas.clientHeight * PIXEL_RATIO;

        // If you have super high dpi then 1. you don't need as many 
        // segments/pixel and 2. you're probably running this on a moderately
        // slow ass-phone.
        this.seglength = 5 * PIXEL_RATIO;
    }

    touchStart = e => {
        if (('button' in e) && e.button > 0) return;

        this.touchPaths.set(e.identifier, []);
        this.touchMove(e);

        return false;
    }

    touchMove = e => {
        const path = this.touchPaths.get(e.identifier);
        if (!path) return;

        const rect = this.canvas.getBoundingClientRect();
        const pos = [
            (e.clientX-rect.left)/(rect.right-rect.left) * this.canvas.width,
            (e.clientY-rect.top)/(rect.bottom-rect.top) * this.canvas.height,
        ];

        const lastPos = path.length ? path[path.length - 1] : false;

        if (!lastPos || d2(pos, lastPos) > this.seglength**2)
            path.push(pos);

        return false;
    }

    touchEnd = e => {
        if (('button' in e) && e.button > 0) return;

        const path = this.touchPaths.get(e.identifier);
        if (!path) return;

        let p = path[0];

        while(d2(p,path[path.length-1]) > this.seglength**2) {
            let q = path[path.length-1];
            let d = subtract(p,q);
            let l = squaredLength(d)**(1/2);
            path.push(add(q,scale(d,this.seglength/l)));
        }

        this.curves.push(new CircularList(path));
        this.touchPaths.delete(e.identifier);

        return false;
    }

    tick() {
        requestAnimationFrame(() => this.tick());
        const canvas = this.canvas;
        const ctx = this.ctx;

        // Clear screen and draw text
        ctx.clearRect(0,0,canvas.width,canvas.height);

        ctx.fillStyle = 'black';
        ctx.textAlign  = 'center';
        ctx.textBaseline = 'top';
        /*
        if (curves.length == 0 && !drawing) {
            ctx.font = '40px Computer Modern Serif';
            ctx.fillText('Draw a closed curve',canvas.width/2, 10);
        }
        */

        // If user is currently drawing any curves, show them in grey.
        ctx.fillStyle = 'darkgrey';
        for (let [id,c] of this.touchPaths.entries()) {
            renderPath(c, ctx, 0.25);
        }

        ctx.fillStyle = 'black';

        // Destroy curve if it is too small or curvature is too extreme
        this.curves = this.curves.filter(cu => 
            cu.length >= 5
            && curvature(cu).max() < 5000
        )

        const inBounds = ([x,y]) => x > 0 && x < canvas.width && y > 0 && y < canvas.height;
        for (let [j,cu] of this.curves.entries()) {
            cu = cu.filter(inBounds);

            // Flow
            cu = this.curves[j] = cu.map(reparametrizedCSF(dt/curvature(cu).max()));

            // Clean
            remesh(cu, this.seglength);
            clean(cu);

            // Render
            renderClosedCurve(cu,ctx);
        }
    };

}
customElements.define('csf-app',CSFApp);
  

/*

            // Generate an interesting demo curve to start.
            var N = 200;
            var curve = [];
            for (var i = 0; i < N; i++) {
                var x = canvas.width/2 + canvas.width*(0.05 * Math.cos(2*Math.PI*i/N));
                curve.push([
                    x + 0.2*canvas.width*Math.pow(Math.cos(2*Math.PI*i/N),101),
                    canvas.height * (0.15 + 0.05 * Math.sin(2*Math.PI*i/N) + 0.05*Math.sin(x/5) + 0.7 * Math.pow(Math.sin(2*Math.PI*i/N), 150))
                ]);
            }
            curves.push(new CircularList(curve));
            */

