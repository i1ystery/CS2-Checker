declare module 'simpleheat' {
  interface SimpleHeatInstance {
    data(d: Array<[number, number, number]>): SimpleHeatInstance;
    max(val: number): SimpleHeatInstance;
    add(point: [number, number, number]): SimpleHeatInstance;
    clear(): SimpleHeatInstance;
    radius(r: number, blur?: number): SimpleHeatInstance;
    resize(): void;
    gradient(grad: Record<number, string>): SimpleHeatInstance;
    draw(minOpacity?: number): SimpleHeatInstance;
  }

  function simpleheat(canvas: HTMLCanvasElement): SimpleHeatInstance;
  export = simpleheat;
}
