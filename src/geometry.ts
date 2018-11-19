// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

// These helper functions perform simple operations on 2D vectors
// represented as javascript arrays.
// For example, |2u+v+w|^2 would be written 
// squaredLength(add(scale(u,2),v,w)).

import { CircularList } from './CircularList';

export type point = [number,number];

export function add(...vs : point[]) : point {
    return vs.reduce(
        ([u,v],[x,y]) => [u+x,v+y]
    );
}

export function subtract([u,v] : point, [x,y] : point) : point {
    return [u-x,v-y];
}

export function scale([x,y] : point, c : number) : point {
    return [x*c,y*c];
}

export function squaredLength([x,y] : point) : number {
    return x*x + y*y;
}

export function dot([u,v] : point,[x,y] : point) : number {
    return u*x + v*y;
}

export function cross([u,v] : point,[x,y] : point) : number {
    return u*y - v*x;
}

export function equals([u,v] : point,[x,y] : point) : boolean {
    return u == x && v == y;
}

export class ScalarFunction extends CircularList<number> {
    max() { return Math.max(...this._data); }
    min() { return Math.min(...this._data); }
}

export class Curve extends CircularList<point> {
    curvature() : ScalarFunction {
        const vals : CircularList<number> = 
            this.map((p,i,x) => {
                const twiceDisplacement = subtract(x(1),x(-1));
                const laplacian = add(x(1), x(-1), scale(x(0),-2));
                const dr2 = squaredLength(subtract(x(1),x(-1))) * 0.25;
                const ret = Math.abs(0.5 * cross(twiceDisplacement, laplacian) * dr2**(-3/2));
                return ret;
            })
        return new ScalarFunction(vals);
    }
}

