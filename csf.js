/* Author: anthony.carapetis@gmail.com
 * This work is free software. It comes without any warranty, to the extent
 * permitted by applicable law.  You can redistribute it and/or modify it under
 * the terms of the Do What The Fuck You Want To Public License, Version 2,
 * as published by Sam Hocevar. See the COPYING file for more details.
 * This work is also one big hack. Don't judge me.
 */

// {{{ Setup
var canvas = $('canvas')[0];
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

    canvas.width    = $('canvas').width() * PIXEL_RATIO;
    canvas.height   = $('canvas').height() * PIXEL_RATIO;

    // If you have super high dpi then 1. you don't need as many 
    // segments/pixel and 2. you're probably running this on a moderately
    // slow ass-phone.
    seglength = 5 * PIXEL_RATIO;
};
// }}}

// {{{ point distance functions for convenience
var d2 = function(a,b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return dx*dx+dy*dy;
};

var len2 = function(a) { return d2(a,{x:0,y:0}); };
// }}}
  
// {{{ Input Handling
$(window).on('resize orientationchange', resize);

var mousemove = function(evt) {
    var rect = canvas.getBoundingClientRect();
    raw_mouse = {
        x: (evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width,
        y: (evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height
    };
    if (drawing && d2(raw_mouse,fresh_curve[fresh_curve.length - 1]) > seglength*seglength) fresh_curve.push(raw_mouse);
};

$(canvas).on('mousemove', mousemove);
$(canvas).on('touchmove', function(e) { 
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

$(canvas).on('touchstart', function(e) {
    mousedown(e.originalEvent.changedTouches[0]); 
    return false;
});
$(canvas).on('mousedown', mousedown);

$(canvas).on('mouseup touchend', function(e) {
    if (!drawing) return;
    if (('button' in e) && e.button > 0) return;
    drawing = false;
    var p = fresh_curve[0];
    while(d2(p,fresh_curve[fresh_curve.length-1]) > seglength*seglength) {
        var q = fresh_curve[fresh_curve.length-1];
        var d = { x: p.x - q.x, y: p.y - q.y };
        var l = Math.pow(len2(d),1/2);
        fresh_curve.push({
            x: q.x + d.x * seglength / l,
            y: q.y + d.y * seglength / l
        });
    }
    curves.push(fresh_curve);
});

// }}}

// {{{ The "one giant function" design pattern
var tick = function() {
    ticks++;

    if (ticks == 1) {
        // Interesting demo curve to start
        var N = 200;
        var curve = [];
        for (var i = 0; i < N; i++) {
            var x = canvas.width/2 + canvas.width*(0.05 * Math.cos(2*Math.PI*i/N));
            curve.push({
                x: x + 0.2*canvas.width*Math.pow(Math.cos(2*Math.PI*i/N),101),
                y: canvas.height * (0.15 + 0.05 * Math.sin(2*Math.PI*i/N) + 0.05*Math.sin(x/5) + 0.7 * Math.pow(Math.sin(2*Math.PI*i/N), 150))
            });
        }
        curves.push(curve);
    }
    
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = 'black';
    ctx.textAlign  = 'center';
    ctx.textBaseline='top';
    if (curves.length == 0 && !drawing) {
        ctx.font = '40px Computer Modern Serif';
        ctx.fillText('Draw a closed curve',canvas.width/2, 10);
    }
    if (debug()) {
        ctx.font = '30px monospace';
        ctx.fillText('canvas space = (' + canvas.width + ',' + canvas.height + ')',canvas.width/2, 80);
        ctx.fillText('<canvas> dims= (' + $(canvas).width() + ',' + $(canvas).height() + ')',canvas.width/2, 120);
    }
    ctx.fillStyle = 'darkgrey';
    if (drawing) drawCurve(fresh_curve, true);
    ctx.fillStyle = 'black';

eachcurve: for (var j = 0; j < curves.length; j++) {
        if (curves[j].length < 5) curves.splice(j,1);
        if (j == curves.length) break;
        var cu = curves[j];

        // Check for infinities and nuke them
        for (var i = 0; i < cu.length; i++) {
            var a = cu[i];
            if (!(isFinite(a.x) && isFinite(a.y))) {
                cu.splice(i--,1);
            }
        }

        // Redivide curve to keep nodes evenly distributed
        for (var i = 0; i < cu.length; i++) {
            var a = cu[i];
            var bi = (i < cu.length - 1 ? i+1 : 0), b = cu[bi];

            var dx = b.x - a.x;
            var dy = b.y - a.y;

            var dr2 = dx*dx + dy*dy;
            if (dr2 > 4*seglength*seglength) {
                var dr = Math.pow(dr2, 1/2);
                cu.splice(1+i,0,{
                    x: a.x + seglength * dx/dr,
                    y: a.y + seglength * dy/dr
                });
            }
            else if (cu.length > 4 && dr2 * 4 < seglength * seglength) {
                cu.splice(i--,1);
            }
        }

        var maxkappa = 0;
        var mean = {x:0, y:0};
        for (var i = 0; i < cu.length; i++) {
            var a  = cu[i];
            var bi = (i < cu.length - 1 ? i+1 : 0),              b = cu[bi];
            var ci = (i < cu.length - 2 ? i+2 : i+2-cu.length),  c = cu[ci];

            var dx = b.dx = 0.5*(c.x - a.x);
            var dy = b.dy = 0.5*(c.y - a.y);
            var ddx = b.ddx = c.x - 2*b.x + a.x;
            var ddy = b.ddy = c.y - 2*b.y + a.y;

            var dr2 = b.dr2 = dx*dx + dy*dy;

            if (dr2 == 0) { 
                // We have a double-back, remove it and continue
                cu.splice(i--,2);
                continue;
            }

            var kappa = b.kappa = (dx * ddy - dy * ddx)/Math.pow(dr2,3/2);

            if (Math.abs(kappa) > maxkappa) maxkappa = Math.abs(kappa);

            mean.x += b.x;
            mean.y += b.y;
        }

        mean.x /= cu.length;
        mean.y /= cu.length;

        // Flow
        var newCurve = JSON.parse(JSON.stringify(cu));
        for (var i = 0; i < cu.length; i++) {
            var b = cu[i];

            var dx = b.dx;
            var dy = b.dy;

            var dr2 = b.dr2;
            var kappa = b.kappa;

            var nu = { x: -dy/Math.pow(dr2,0.5), y: dx/Math.pow(dr2,0.5) };

            newCurve[i] = {
                // Reparametrized CSF:
                x:  b.x + b.ddx * dt / (dr2 * maxkappa),
                y:  b.y + b.ddy * dt / (dr2 * maxkappa),
                kappa: kappa
            };

            if (newCurve[i].x > canvas.width + 1
                    || newCurve[i].x < -1
                    || newCurve[i].y > canvas.height +1
                    || newCurve[i].y < -1) {
                // Out of bounds,  must have been some kind of numerical instability
                // Try just cutting out the single node, but usually this ends up getting nuked
                newCurve.splice(i,1);
                cu.splice(i--,1);
            }
        }
        cu = curves[j] = newCurve;

        if (debug()) {
            ctx.fillStyle = 'green';
            ctx.textBaseline = 'middle';
            ctx.fillText(cu.length,mean.x,mean.y);
        }
        drawCurve(cu);

        if (maxkappa > 5000 || curves[j].length < 5) curves.splice(j--,1);
    }
};
// }}}

// {{{ ...at least I factored this out
var drawCurve = function(cu, no_close) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cu[0].x, cu[0].y);
    for (var i = 1; i < cu.length; i++) {
        ctx.lineTo(cu[i].x, cu[i].y);
        var z = Math.round(i * 255 / cu.length);
    }
    ctx.stroke();
    if (no_close) ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(cu[0].x,cu[0].y);
    ctx.lineTo(cu[cu.length-1].x,cu[cu.length-1].y);
    ctx.stroke();

    ctx.globalAlpha= 1;
    ctx.fillStyle = 'red';
    for (var i = 0; i < cu.length; i++) {
        if (Math.abs(cu[i].kappa) > 1) {
            ctx.fillCircle(cu[i].x,cu[i].y,Math.log(1+Math.abs(cu[i].kappa)));
        }
        if (debug()) ctx.fillRect(cu[i].x - 1, cu[i].y - 1, 3, 3);
    }
    ctx.restore();
};
// }}}

// {{{ bombs away
$(window).on('load',function() {
    resize();
    setInterval(tick, 15);
    MathJax.Hub.Queue(resize);
});
// }}}
