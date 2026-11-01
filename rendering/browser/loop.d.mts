export type RenderLoop = {
  invalidate(): void;
  setContinuous(value: boolean): void;
  pause(): void;
  resume(): void;
  destroy(): void;
};
export function createRenderLoop(
  draw: (now: number, dt: number) => boolean | void | Promise<boolean | void>,
  options?: { element?: Element; continuous?: boolean; fps?: number; onError?: (error: unknown) => void },
): RenderLoop;
