import simpleheat from 'simpleheat';

export type SimpleHeatInstance = ReturnType<typeof simpleheat>;

export function SimpleHeat(canvas: HTMLCanvasElement): SimpleHeatInstance {
  return simpleheat(canvas);
}
