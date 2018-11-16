// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

// These helper functions perform simple operations on 2D vectors
// represented as javascript arrays.
// For example, |2u+v+w|^2 would be written 
// squaredLength(add(scale(u,2),v,w)).

export function add(...vs) {
    return vs.reduce(
        ([u,v],[x,y]) => [u+x,v+y]
    );
}

export function subtract([u,v],[x,y]) {
    return [u-x,v-y];
}

export function scale([x,y],c) {
    return [x*c,y*c];
}

export function squaredLength([x,y]) {
    return x*x+y*y;
}

export function cross([u,v],[x,y]) {
    return u*y - v*x;
}

export function equals([u,v],[x,y]) {
    return u == x && v == y;
}

export function curvature(curve) {
    return curve.map((p,i,x) => {
        const twiceDisplacement = subtract(x(1),x(-1));
        const laplacian = add(x(1), x(-1), scale(x(0),-2));
        const dr2 = squaredLength(subtract(x(1),x(-1))) * 0.25;
        return 0.5 * cross(twiceDisplacement, laplacian) * dr2**(-3/2);
    });
}
