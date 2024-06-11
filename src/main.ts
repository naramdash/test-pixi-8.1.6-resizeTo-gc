import { Application } from "pixi.js";

const weakMap = new WeakMap();
// @ts-ignore
window.__weakMap = weakMap;

const registry = new FinalizationRegistry((heldvalue) => {
  console.debug("Finalized", heldvalue);
});

function watch(target: WeakKey, heldvalue: unknown) {
  registry.register(target, heldvalue);
  weakMap.set(target, heldvalue);
}

function makeMyPixiComponent(applyResizeTo: boolean) {
  const MyPixiComponent = class extends HTMLElement {
    #container: HTMLDivElement;
    #pixiApp: Application;

    constructor() {
      super();
      const shadowRoot = this.attachShadow({ mode: "open" });

      this.#container = document.createElement("div");
      this.#container.style.width = "90vw";
      this.#container.style.height = "200px";
      this.#container.style.border = "1px solid black";
      this.#container.innerText = `My Pixi Component ${
        applyResizeTo ? "with" : "without"
      } resizeTo`;

      this.#pixiApp = new Application();

      this.#pixiApp
        .init({
          resizeTo: applyResizeTo ? this.#container : undefined,
          backgroundColor: 0xbb9381,
        })

        .then(() => {
          this.#container.append(this.#pixiApp.canvas);
          shadowRoot.append(this.#container);
          this.#pixiApp.resize();

          watch(this.#pixiApp, "pixiApp");
          watch(this.#container, "container");
          watch(this, "myPixiComponent");
        });
    }

    destroy(): this {
      // @ts-ignore
      this.#pixiApp.resizeTo = null;

      this.#pixiApp.destroy({ removeView: true });
      // @ts-ignore
      this.#pixiApp = null;

      this.#container.remove();
      // @ts-ignore
      this.#container = null;

      return this;
    }
  };

  return MyPixiComponent;
}

function main(applyResizeTo: boolean) {
  const MyPixiComponent = makeMyPixiComponent(applyResizeTo);

  customElements.define("my-pixi-component", MyPixiComponent);
  const app = document.getElementById("app")!;

  const myPixiComponent = new MyPixiComponent();
  app.append(myPixiComponent);

  setTimeout(() => {
    myPixiComponent.destroy().remove();
    app.innerHTML = "";
  }, 2500);
}

main(true);
