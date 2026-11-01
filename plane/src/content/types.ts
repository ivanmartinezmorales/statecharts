// The words of the tour. Each entry is one stop as you scroll: `summary` rides on the card over the picture, and
// the rest opens when you go deeper.

export type Fact = readonly [label: string, value: string]

export type Entry = {
  title: string
  /** One or two plain sentences for the scroll card. */
  summary: string
  /** The deep dive: two to five paragraphs at the level an airline engineer or pilot would respect. */
  body: string[]
  /** An ordered how-it-works sequence, when the thing has one. */
  steps?: string[]
  /** Three to six specs or numbers, label first. */
  facts: Fact[]
}

export type Chapter = {
  id: string
  title: string
  /** A sentence or two that opens the chapter. */
  intro: string
  entries: Record<string, Entry>
}
