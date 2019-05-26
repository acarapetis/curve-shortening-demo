// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

// These helper functions perform simple operations on 2D vectors
// represented as javascript arrays.
// For example, |2u+v+w|^2 would be written 
// squaredLength(add(scale(u,2),v,w)).

import { CircularList, Neighbourhood } from './CircularList';

export type Point = [number,number];

export function add(...vs : Point[]) : Point {
    return vs.reduce(
        ([u,v],[x,y]) => [u+x,v+y]
    );
}

export function subtract([u,v] : Point, [x,y] : Point) : Point {
    return [u-x,v-y];
}

export function scale([x,y] : Point, c : number) : Point {
    return [x*c,y*c];
}

export function scaleFrom(point : Point, center : Point, factor : number) : Point {
    return add(scale(subtract(point, center), factor), center);
}

export function squaredLength([x,y] : Point) : number {
    return x*x + y*y;
}

export function dot([u,v] : Point,[x,y] : Point) : number {
    return u*x + v*y;
}

export function cross([u,v] : Point,[x,y] : Point) : number {
    return u*y - v*x;
}

export function equals([u,v] : Point,[x,y] : Point) : boolean {
    return u == x && v == y;
}

export class ScalarFunction extends CircularList<number> {
    max() { return Math.max(...this._data); }
    min() { return Math.min(...this._data); }
}

export function curvature(x : Neighbourhood<Point>) : number {
    const twiceDisplacement = subtract(x(1),x(-1));
    const laplacian = add(x(1), x(-1), scale(x(0),-2));
    const dr2 = squaredLength(subtract(x(1),x(-1))) * 0.25;
    return Math.abs(0.5 * cross(twiceDisplacement, laplacian) * dr2**(-3/2));
}

export class Curve extends CircularList<Point> {
    curvature() : ScalarFunction {
        return new ScalarFunction(
            this.map((p,i,nbhd) => curvature(nbhd)) as CircularList<number>
        );
    }

    area() : number {
        const n = this.length;
        
        let sum0 = 0;
        for(let i = 0; i < n; ++i) {
            sum0 += this.get(i)[0] * this.get(i+1)[1];
        }
        
        let sum1 = 0;
        for(let i = 0; i < n; ++i) {
            sum1 += this.get(i+1)[0] * this.get(i)[1];
        }

        return Math.abs(sum0 - sum1) / 2;
    }

    center() : Point {
        return scale(add(...this), 1/this.length);
    }

    scale(c : number) : Curve {
        const center = this.center();
        return this.map(p => scaleFrom(p, center, c));
    }
}

