export default function customElement<T extends typeof HTMLElement>(tagName:string) {
    return (constructor:T) => { customElements.define(tagName,constructor) };
}
