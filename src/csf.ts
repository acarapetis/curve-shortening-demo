// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

import {reparametrizedCSF, remesh, clean} from './flow';
import {renderClosedCurve, renderPath} from './graphics';
import {point,Curve,scale,add,subtract,squaredLength} from './geometry';
import {CircularList} from './CircularList';
import {LitElement, html, property} from '@polymer/lit-element';
import customElement from './customElement';
import bind from 'bind-decorator';

const d2 = (a : point, b : point) => squaredLength(subtract(a,b));
const dt = 1;

// Helper method for handling mouse and touch using the same functions
// TODO: are native pointerEvents mature yet?
function eachTouch(handler : (touch : Touch) => any) {
    return (e : any) => {
        if (('button' in e) && e.button > 0) return;

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

@customElement('csf-app')
class CSFApp extends LitElement {
    touchPaths : Map<any,point[]> = new Map();
    curves : Curve[] = [];
    ctx ?: CanvasRenderingContext2D;
    seglength : number = 5;

    @property({type: Number})
    bufferWidth = 300;

    @property({type: Number})
    bufferHeight = 200;

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

    get canvas() : HTMLCanvasElement|undefined {
        return this.shadowRoot && this.shadowRoot.querySelector('canvas') || undefined;
    }

    firstUpdated() {
        window.addEventListener('resize', this.resize);
        window.addEventListener('orientationchange', this.resize);
        this.ctx = this.canvas && this.canvas.getContext('2d') || undefined;
        this.resize();
        this.tick();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('resize', this.resize);
        window.removeEventListener('orientationchange', this.resize);
    }

    @bind
    resize() {
        // Make sure 1 canvas pixel = 1 screen pixel
        const ctx : any = this.ctx;
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const bsr = ctx.webkitBackingStorePixelRatio 
            ||  ctx.mozBackingStorePixelRatio
            ||  ctx.msBackingStorePixelRatio
            ||  ctx.oBackingStorePixelRatio
            ||  ctx.backingStorePixelRatio || 1;
        const PIXEL_RATIO = dpr/bsr;

        this.bufferWidth    = this.canvas && this.canvas.clientWidth * PIXEL_RATIO || 0;
        this.bufferHeight   = this.canvas && this.canvas.clientHeight * PIXEL_RATIO || 0;

        // If you have super high dpi then 1. you don't need as many 
        // segments/pixel and 2. you're probably running this on a moderately
        // slow ass-phone.
        this.seglength = 5 * PIXEL_RATIO;
    }

    @bind
    touchStart(e : Touch) {
        this.touchPaths.set(e.identifier, []);
        this.touchMove(e);
        return false;
    }

    @bind
    touchMove(e : Touch) {
        const path = this.touchPaths.get(e.identifier);
        if (!path) return;

        if (!this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const pos : point = [
            (e.clientX-rect.left)/(rect.right-rect.left) * this.canvas.width,
            (e.clientY-rect.top)/(rect.bottom-rect.top) * this.canvas.height,
        ];

        const lastPos = path.length ? path[path.length - 1] : false;

        if (!lastPos || d2(pos, lastPos) > this.seglength**2)
            path.push(pos);

        return false;
    }

    @bind
    touchEnd(e : Touch) {
        const path = this.touchPaths.get(e.identifier);
        if (!path) return;

        let p = path[0];

        while(d2(p,path[path.length-1]) > this.seglength**2) {
            let q = path[path.length-1];
            let d = subtract(p,q);
            let l = squaredLength(d)**(1/2);
            path.push(add(q,scale(d,this.seglength/l)));
        }

        this.curves.push(new Curve(path));
        this.touchPaths.delete(e.identifier);

        return false;
    }

    @bind
    tick() {
        requestAnimationFrame(this.tick);
        const canvas = this.canvas;
        const ctx = this.ctx;
        if (!ctx || !canvas) return;

        ctx.fillStyle = 'red';
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
            cu.length >= 5 && cu.curvature().max() < 5000
        )

        const inBounds = ([x,y] : point) => x > 0 && x < canvas.width && y > 0 && y < canvas.height;
        for (let [j,cu] of this.curves.entries()) {
            cu = cu.filter(inBounds);

            // Flow
            cu = this.curves[j] = cu.map(reparametrizedCSF(dt/cu.curvature().max()));

            // Clean
            remesh(cu, this.seglength);
            clean(cu);

            // Render
            renderClosedCurve(cu,ctx);
        }
    };

}

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

