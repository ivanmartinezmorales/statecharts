// The shape of a model as the fold engine reads it. Everything here is plain data, serialized to
// JSON and folded by the Rust engine in ../engine.

export type Vec2 = { x: number; y: number };
export type Line = readonly [Vec2, Vec2];

export const v = (x: number, y: number): Vec2 => ({ x, y });

/**
 * Which layers a fold takes. A face qualifies when every given condition holds.
 * `half` looks at where the face sits on the unfolded sheet, split at `at` (default 50).
 */
export interface Only {
  readonly half?: 'top' | 'bottom' | 'left' | 'right';
  readonly at?: number;
  readonly movedIn?: string;
  readonly notMovedIn?: readonly string[];
}

export type Step =
  | {
      readonly kind: 'valley' | 'mountain' | 'crease';
      /** Lets later steps refer to the layers this one moved. */
      readonly id?: string;
      readonly line: Line;
      /** Any point on the side of the line that moves. */
      readonly move: Vec2;
      readonly only?: Only;
      readonly text: string;
    }
  | { readonly kind: 'flip'; readonly id?: string; readonly text: string }
  | { readonly kind: 'rotate'; readonly id?: string; readonly deg: number; readonly text: string };

/** Eyes and noses drawn on a finished model, in paper coordinates. */
export interface Dot {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}
