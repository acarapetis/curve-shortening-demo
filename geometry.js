// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

// These helper functions perform simple operations on vectors
// represented as javascript arrays.
// For example, |2u+v+w|^2 would be written 
// squaredLength(add(scale(u,2),v,w)).

export function add(...vs) {
    return vs.reduce(
        (acc,v) => acc.map((x,i) => x + v[i])
    );
}

export function subtract(v1,v2) {
    return v1.map((x,i) => x - v2[i]);
}

export function scale(v,c) {
    return v.map(x => x*c);
}

export function squaredLength(v) {
    return v
        .map(x => x*x)
        .reduce((acc,x) => acc+x);
}
