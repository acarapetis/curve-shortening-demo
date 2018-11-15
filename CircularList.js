// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

export class CircularList {
    constructor(data=[]) {
        this._data = Array.from(data);
    }

    get length() {
        return this._data.length;
    }

    get(index) {
        return this._data[mod(index,this.length)];
    }

    set(index,value) {
        this._data[mod(index,this.length)] = value;
    }

    splice(index,count,...values) {
        // easy cases
        if (count >= this.length) {
            this._data = [];
            return;
        }

        if (index + count < this.length) {
            this._data.splice(index,count,...values);
            return;
        }

        // wrap-around case
        const endLength = this.length - index;
        const startLength = count - endLength;
        this._data.splice(index, endLength, ...values.slice(0, endLength));
        this._data.splice(0, startLength, ...values.slice(endLength));
    }

    *[Symbol.iterator]() {
        for (let v of this._data) yield v;
    }

    *neighbourhoods() {
        for (let [index,value] of this._data.entries()) {
            yield this.neighbourhood(index);
        }
    }

    neighbourhood(index) {
        return offset => this.get(index + offset);
    }

    map(fn) {
        return new CircularList(
            this._data.map((x,i) => fn(x,i,this.neighbourhood(i)))
        )
    }
}

// A sensible modulo:
// The unique integer congruent to k mod n in [0,..,n-1]
function mod(k,n) {
    return (k%n + n)%n;
}

class Curve {
    constructor(data = []) {
        this.points = new CircularList(data);
    }
}

window.CircularList = CircularList;
