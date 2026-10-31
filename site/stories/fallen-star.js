'use strict';
// What the site adds to the checked chart of "Pip and the Fallen Star": the picture for each state, the words to
// read aloud, and the rules in plain words. The states, the steps and which rules hold come from the chart.
const path = require('path');

module.exports = {
  id: 'fallen-star',
  title: 'Pip and the Fallen Star',
  tagline: 'A bedtime story with forks in the path. Choose what Pip does next. There are two endings, and on every path Twinkle gets home.',
  chart: path.join(__dirname, '..', '..', 'pixel', 'stories', 'fallen-star', 'model', 'chart'),
  scenes: require('../../pixel/stories/fallen-star/scenes').scenes,
  states: {
    'A star falls': {
      scene: 'window',
      text: 'Everyone in the house was fast asleep. Everyone except Pip. From the windowsill, the little bear watched a star slip out of the sky and tumble, twinkling, into the garden.',
      alt: 'A dark bedroom. A girl sleeps under a purple quilt while her teddy bear sits on the windowsill, watching a shooting star.',
    },
    'The fallen star': {
      scene: 'garden',
      text: 'In the wet grass sat a tiny star, no bigger than a button. "I\'m Twinkle," she sniffed. "I fell, and now I\'m too dim to find my way home." Pip held out his paw. "Then I\'ll help you."',
      alt: 'The teddy bear stands in a moonlit garden beside a small, dim star with a sad face.',
    },
    'The old owl': {
      scene: 'owl',
      text: 'The old owl blinked her big round eyes. "Stars ride home on the Moon Whale," she hooted, "but she only comes when someone sings." Then she taught them her lullaby, soft as feathers.',
      alt: 'An owl on a branch in front of a huge full moon sings to the bear and the little star below.',
    },
    'The moon pond': {
      scene: 'pond',
      text: 'A frog sat on a lily pad in the middle of the pond. "Need a light?" he croaked, and dipped Pip\'s jar into the moon\'s reflection. It came up full of glowing moon-water.',
      alt: 'A frog on a lily pad in a moonlit pond with glowing water lilies. The bear holds a jar of glowing water, the little star beside him.',
    },
    'Firefly meadow': {
      scene: 'meadow',
      text: 'The meadow was full of tiny lights. "It\'s dark up in the clouds," said Pip. So the fireflies crowded into his jar, and it glowed like a lantern.',
      alt: 'The bear holds a glowing jar in a meadow full of fireflies, with the little star floating beside him.',
    },
    'The cloud sea': {
      scene: 'clouds',
      text: 'Up the cloud stairs they climbed, and a paper boat was waiting at the top. They sailed out over the soft purple clouds, the lantern swinging and Twinkle riding up front.',
      alt: 'The bear sails a paper boat across a sea of purple clouds under a crescent moon, the star shining above the sail.',
    },
    'The Moon Whale': {
      scene: 'whale',
      text: 'Pip took a deep breath and sang to the moon. Out of the dark swam the Moon Whale, her back speckled with starlight. "What a lovely song," she rumbled. "Climb aboard."',
      alt: 'A huge blue whale with glowing spots swims through the night sky toward the little boat, music notes rising.',
    },
    'Home in the sky': {
      scene: 'sky',
      text: 'Higher and higher the whale swam, until Twinkle leapt back into her place in the sky and shone brighter than ever. "Thank you, Pip!" she sparkled.',
      alt: 'The little star shines brightly among the constellations while the bear rides on the whale below.',
    },
    'Sweet dreams': {
      scene: 'dreams',
      text: 'Pip floated home on a dandelion seed and snuggled back into bed. Outside the window, one little star winked goodnight. Sweet dreams.',
      alt: 'Back in the bedroom, the girl and her bear sleep while a bright new star twinkles in the window.',
    },
    'The cloud sheep': {
      scene: 'sheep',
      text: 'Fluffy cloud sheep came bouncing by. "We can reach the sky!" they bleated, and climbed onto each other\'s backs, higher and higher, until the top sheep set Twinkle back in her place. Pip started counting them. One... two... three...',
      alt: 'Cloud sheep stand on each other\'s backs in a tall tower, lifting the little star into the sky. The bear dozes in his paper boat.',
    },
    'Stardust morning': {
      scene: 'morning',
      text: 'When the girl woke up, Pip was tucked in beside her, covered in sparkly stardust. She never found out how it got there. But Pip knows, and so does Twinkle.',
      alt: 'Morning sun fills the bedroom. The girl sits up in bed holding her bear, who sparkles with stardust.',
    },
  },
  rules: {
    LightInTheClouds: 'Pip never goes up into the dark clouds without a light',
    SongForTheWhale: 'The Moon Whale only comes when someone sings',
    StarHomeBeforeTheEnd: 'Twinkle always gets home before the story ends',
    NoDeadlock: 'The story never gets stuck: every path reaches an ending',
  },
};
