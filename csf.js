// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

import {reparametrizedCSF, remesh,clean} from './flow.js';
import {renderClosedCurve, renderPath} from './graphics.js';
import {scale,curvature,add,subtract,squaredLength} from './geometry.js';
import {CircularList} from './CircularList.js';

// {{{ Setup
var canvas = document.querySelector('canvas');
canvas.onselectstart = function() {return false;};
var ctx = canvas.getContext('2d');
var raw_mouse = {x:0, y:0};
var ticks = 0;
var seglength = 5;
var debug = function() { return /debug/.test(window.location.hash); };
var drawing = false;
var fresh_curve = [];
var curves = [];
var dt = 1;

ctx.fillCircle = function(x,y,r) {
    this.beginPath();
    this.arc(x,y,r,0,2*Math.PI);
    this.closePath();
    this.fill();
};

var resize = function() {
    // Make sure 1 canvas pixel = 1 screen pixel
    var dpr = window.devicePixelRatio || 1;
    var bsr = ctx.webkitBackingStorePixelRatio 
          ||  ctx.mozBackingStorePixelRatio
          ||  ctx.msBackingStorePixelRatio
          ||  ctx.oBackingStorePixelRatio
          ||  ctx.backingStorePixelRatio || 1;
    var PIXEL_RATIO = dpr/bsr;

    canvas.width    = canvas.clientWidth * PIXEL_RATIO;
    canvas.height   = canvas.clientHeight * PIXEL_RATIO;

    // If you have super high dpi then 1. you don't need as many 
    // segments/pixel and 2. you're probably running this on a moderately
    // slow ass-phone.
    seglength = 5 * PIXEL_RATIO;
};
// }}}

const d2 = (a,b) => squaredLength(subtract(a,b));
  
// {{{ Input Handling
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);

var mousemove = function(evt) {
    var rect = canvas.getBoundingClientRect();
    raw_mouse = [
        (evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width,
        (evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height,
    ];
    if (drawing && d2(raw_mouse,fresh_curve[fresh_curve.length - 1]) > seglength*seglength) fresh_curve.push(raw_mouse);
};

canvas.addEventListener('mousemove', mousemove);
canvas.addEventListener('touchmove', function(e) { 
    mousemove(e.originalEvent.changedTouches[0]); 
    return false;
});

var mousedown = function(e) {
    if (('button' in e) && e.button > 0) return;
    mousemove(e);
    drawing = true;
    fresh_curve = [raw_mouse];
    return false;
};

canvas.addEventListener('touchstart', function(e) {
    mousedown(e.originalEvent.changedTouches[0]); 
    return false;
});
canvas.addEventListener('mousedown', mousedown);

function mouseup(e) {
    if (!drawing) return;
    if (('button' in e) && e.button > 0) return;
    drawing = false;
    var p = fresh_curve[0];
    while(d2(p,fresh_curve[fresh_curve.length-1]) > seglength*seglength) {
        var q = fresh_curve[fresh_curve.length-1];
        var d = subtract(p,q);
        var l = Math.pow(squaredLength(d),1/2);
        fresh_curve.push(add(q,scale(d,seglength/l)));
    }
    curves.push(new CircularList(fresh_curve));
}
canvas.addEventListener('mouseup', mouseup);
canvas.addEventListener('touchend', mouseup);
// }}}

var tick = function() {
    requestAnimationFrame(tick);
    ticks++;

    if (ticks == 1) { // first tick
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
    }
    
    // Clear screen and draw text
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = 'black';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'top';
    if (curves.length == 0 && !drawing) {
        ctx.font = '40px Computer Modern Serif';
        ctx.fillText('Draw a closed curve',canvas.width/2, 10);
    }
    if (debug()) {
        ctx.font = '30px monospace';
        ctx.fillText('canvas space = (' + canvas.width + ',' + canvas.height + ')',canvas.width/2, 80);
        ctx.fillText('<canvas> dims= (' + $(canvas).width() + ',' + $(canvas).height() + ')',canvas.width/2, 120);
    }

    // If user is currently drawing a curve, show it in grey.
    ctx.fillStyle = 'darkgrey';
    if (drawing) renderPath(fresh_curve, ctx, 0.25);
    ctx.fillStyle = 'black';

    curves = curves.filter(cu => cu.length >= 5)
    for (let [j,cu] of curves.entries()) {
        cu = cu.filter(([x,y]) => isFinite(x) && isFinite(y));

        remesh(cu, seglength);
        clean(cu);

        let maxkappa = curvature(cu).max();

        // Flow
        cu = curves[j] = cu.map(reparametrizedCSF(dt/maxkappa));

        // Render
        renderClosedCurve(cu,ctx);

        // Destroy curve if it is too small or curvature is too extreme
        if (maxkappa > 5000 || curves[j].length < 5) curves.splice(j--,1);
    }
};

window.addEventListener('load',function() {
    resize();
    tick();
    MathJax.Hub.Queue(resize);
});
