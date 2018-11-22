// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

import { Point, Curve } from './geometry';
import { LocalFunction } from './CircularList';

function constant<T>(c : T) {
    return () => c;
}

interface renderClosedCurveOpts {
    colorFunction ?: LocalFunction<Point, string>;
}
/** Render a closed curve.
 * @param curve a CircularList of [x,y] pairs
 * @param ctx a 2d drawing context, e.g. as obtained from canvas.getContext('2d');
 */
export function renderClosedCurve(
    curve : Curve, 
    ctx : CanvasRenderingContext2D, 
    { colorFunction = constant('black') } : renderClosedCurveOpts = {}
) {
    ctx.save();

    curve.forEach((point, index, nbhd) => {
        ctx.strokeStyle = colorFunction(point, index, nbhd);
        ctx.beginPath();
        ctx.moveTo(...nbhd(0));
        ctx.lineTo(...nbhd(1));
        ctx.stroke();
    });

    ctx.restore();
}

/** Render a closed curve.
 * @param curve an array of [x,y] pairs
 * @param ctx a 2d drawing context, e.g. as obtained from canvas.getContext('2d');
 * @param join_opacity the opacity of the path joining the start to finish
 */
export function renderPath(path : Point[], ctx : CanvasRenderingContext2D, join_opacity : number = 0) {
    ctx.save();
    ctx.strokeStyle = 'black';

    ctx.beginPath();
    ctx.moveTo(...path[0]);
    for (let point of path) {
        ctx.lineTo(...point);
    }

    ctx.stroke();

    if (join_opacity) {
        ctx.globalAlpha = join_opacity;
        ctx.beginPath();
        ctx.lineTo(...path[0]);
        ctx.stroke();
    }

    ctx.restore();
}
