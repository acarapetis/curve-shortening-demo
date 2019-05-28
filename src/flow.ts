// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

import { LocalFunction } from './CircularList';
import { Point, add, subtract, scale, squaredLength, equals, 
    Curve, ScalarFunction } from './geometry';

// Forward Euler approximation to CSF with tangential reparametrization
export function flowStep(dt : number) : LocalFunction<Point, Point>{
    return (point, index, x) => {
        let laplacian = add(x(1), x(-1), scale(x(0),-2));
        let dr2 = squaredLength(subtract(x(1),x(-1))) * 0.25;
        return add(x(0), scale(laplacian, dt / dr2));
    }
}

export function remesh(cu : Curve, seglength : number) {
    // Remesh: Redivide curve to keep nodes evenly distributed
    for (let i = 0; i < cu.length; i++) {
        const a = cu.get(i);
        const b = cu.get(i+1);
        const displacement = subtract(b,a);
        const dr2 = squaredLength(displacement);

        if (dr2 > 4*seglength*seglength) {
            // If vertices are too far apart, add a new vertex in between
            cu.splice(1+i, 0,
                add(a, scale(displacement, seglength * dr2 ** (-1/2)))
            );
        }

        else if (cu.length > 4 && dr2 * 4 < seglength**2) {
            // If vertices are too close, remove one of them
            cu.splice(i--,1);
        }
    }
}

export function clean(cu : Curve) {
    for (let i = 0; i < cu.length; i++) {
        if (equals(cu.get(i), cu.get(i+2))) cu.splice(i--,2);
    }
}

interface FullStepOpts {
    bounds?: [Point, Point];
    seglength?: number;
}

export function fullStep(cu: Curve, dt: number, 
    {bounds, seglength = 5}: FullStepOpts = {}): Curve|null 
{
    if (bounds) cu = cu.filter(([x,y]) => 
        x >= bounds[0][0] && x <= bounds[1][0] && y >= bounds[0][1] && y <= bounds[1][1]
    );
    const curvature = cu.curvature();
    if (cu.length < 5 || curvature.max() > 5000) return null;

    cu = cu.map(flowStep(dt/curvature.max()));
    remesh(cu, seglength);
    clean(cu);
    return cu;
}
