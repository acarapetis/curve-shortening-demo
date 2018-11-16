// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

import {add, subtract, scale, squaredLength, equals} from './geometry.js';
import {CircularList} from './CircularList.js';

// Forward Euler approximation to CSF with tangential reparametrization
export function reparametrizedCSF(dt) {
    return (point, index, x) => {
        let laplacian = add(x(1), x(-1), scale(x(0),-2));
        let dr2 = squaredLength(subtract(x(1),x(-1))) * 0.25;
        return add(x(0), scale(laplacian, dt / dr2));
    }
}

export function flowArray(array, dt) {
    return Array.from(
        (new CircularList(array)).map(reparametrizedCSF(dt))
    );
}

export function remesh(cu,seglength) {
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

export function clean(cu) {
    for (let i = 0; i < cu.length; i++) {
        if (equals(cu.get(i), cu.get(i+2))) cu.splice(i--,2);
    }
}
