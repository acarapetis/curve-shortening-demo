// Copyright (c) 2014-2018 Anthony Carapetis
// This software is licensed under the MIT license.
// See COPYING for more details.

import { point } from './geometry';

export type localFunction<T,V> =
    (element : T, index : number, neighbourhood : ((offset : number) => T)) => V;

export class CircularList<T> {
    _data : T[] = []

    constructor(data : T[]|CircularList<T> = []) {
        this._data = (data instanceof CircularList) ? data._data: [...data];
    }

    get length() {
        return this._data.length;
    }

    get(index : number) {
        return this._data[mod(index,this.length)];
    }

    set(index : number, value : T) {
        this._data[mod(index,this.length)] = value;
    }

    splice(index : number, count : number, ...values : T[]) {
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

    filter(fn : localFunction<T,boolean>) {
        return new (this.constructor as any)(this._data.filter(
            (x,i) => fn(x,i,this.neighbourhood(i))
        ));
    }

    [Symbol.iterator]() {
        return this._data.values();
    }

    *neighbourhoods() {
        for (let [index,value] of this._data.entries()) {
            yield this.neighbourhood(index);
        }
    }

    neighbourhood(index : number) {
        return (offset : number) => this.get(index + offset);
    }

    map<V,W extends CircularList<V>>(fn : localFunction<T,V>) : W {
        return new (this.constructor as any)(
            this._data.map((x,i) => fn(x,i,this.neighbourhood(i)))
        )
    }
}

// A sensible modulo:
// The unique integer congruent to k mod n in [0,..,n-1]
function mod(k : number, n : number) {
    return (k%n + n)%n;
}
