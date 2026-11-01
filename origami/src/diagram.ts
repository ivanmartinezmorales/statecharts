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
  /** A polygon on the unfolded sheet the face must lie in. */
  readonly within?: readonly Vec2[];
  /** The front or back half of the layers that would move. */
  readonly layers?: 'front' | 'back';
}

/** One group of faces in a compound fold. */
export interface Part {
  /** Matching faces are cut along this line; the pieces on `side` belong to the part. */
  readonly line: Line;
  readonly side: Vec2;
  readonly only?: Only;
  /** The lines the part is reflected across, in order. Defaults to `line`. */
  readonly over?: readonly Line[];
  /** Which way it lifts off the table on the way: toward you (default) or away. */
  readonly swing?: 'up' | 'down';
  /** Where it lands in the stack: on top (default), underneath, between the layers it was cut from, or in place. */
  readonly stack?: 'top' | 'bottom' | 'inside' | 'place';
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
  | { readonly kind: 'rotate'; readonly id?: string; readonly deg: number; readonly text: string }
  /** Several groups of faces moving at once, each across its own lines. */
  | { readonly kind: 'squash' | 'petal' | 'collapse'; readonly id?: string; readonly parts: readonly Part[]; readonly text: string }
  /** The front layers of a flap fold one way and the back layers the other, along one line. */
  | {
      readonly kind: 'reverse';
      readonly id?: string;
      readonly direction: 'inside' | 'outside';
      readonly line: Line;
      readonly move: Vec2;
      readonly only?: Only;
      readonly text: string;
    };

/** Eyes and noses drawn on a finished model, in paper coordinates. */
export interface Dot {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}
