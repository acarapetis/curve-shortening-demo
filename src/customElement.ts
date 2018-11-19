export default function classDecorator<T extends {new(...args:any[]):{}}> (tagName:string) {
    return (constructor : T) => {
        customElements.define(tagName,constructor);
        return constructor;
    }
}
