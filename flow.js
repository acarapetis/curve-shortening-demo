// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

import {add, subtract, scale, squaredLength} from './geometry.js';
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
