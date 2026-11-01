// Words for the chart of "Pip and the Fallen Star".
export const title = "Pip and the Fallen Star";

export const state = (v) =>
  ({
    window: "A star falls",
    garden: "The fallen star",
    owl: "The old owl",
    meadow: "Firefly meadow",
    clouds: "The cloud sea",
    whale: "The Moon Whale",
    sky: "Home in the sky",
    dreams: "Sweet dreams",
  })[v.place];

const steps = {
  SlipOut: "Pip slips out the window",
  AskTheOwl: "ask the old owl for help",
  FollowTheFireflies: "follow the fireflies",
  ClimbTheCloudStairs: "climb the cloud stairs",
  SingToTheMoon: "sing to the moon",
  LiftTwinkleHome: "the whale lifts Twinkle home",
  FloatHome: "float home on a dandelion",
  TheEnd: "the end",
};
export const step = (action) => steps[action];

export const group = (v) =>
  ["window", "dreams"].includes(v.place) ? "home" : ["garden", "owl", "meadow"].includes(v.place) ? "garden" : "sky";
export const colors = { home: "purple", garden: "teal", sky: "yellow" };
