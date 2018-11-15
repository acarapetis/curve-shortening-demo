// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

import {CircularList} from './CircularList.js';

/** Render a closed curve.
 * @param curve a CircularList of [x,y] pairs
 * @param ctx a 2d drawing context, e.g. as obtained from canvas.getContext('2d');
 */
export function renderClosedCurve(curve,ctx) {
    ctx.save();
    ctx.beginPath();

    const last = curve.get(-1);
    ctx.moveTo(...last);

    for (let point of curve) {
        ctx.lineTo(...point);
    }

    ctx.stroke();
    ctx.restore();
}

/** Render a closed curve.
 * @param curve an array of [x,y] pairs
 * @param ctx a 2d drawing context, e.g. as obtained from canvas.getContext('2d');
 * @param join_opacity the opacity of the path joining the start to finish
 */
export function renderPath(path,ctx,join_opacity=0) {
    ctx.save();

    ctx.moveTo(...path[0]);
    for (let point of path) {
        ctx.lineTo(...point);
    }

    ctx.stroke();

    if (join_opacity) {
        ctx.globalAlpha = join_opacity;
        ctx.lineTo(...path[0]);
        ctx.stroke();
    }

    ctx.restore();
}
