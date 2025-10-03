// src/particles.js

// A master list of common particles to generate incorrect answers (distractors)
export const allParticles = ['は', 'が', 'を', 'に', 'へ', 'で', 'と', 'も', 'の', 'から', 'まで'];

// The questions for the particle quiz
export const particleSentences = [
  {
    japanese: '私___田中です。',
    english: 'I am Tanaka.',
    particle: 'は',
  },
  {
    japanese: 'これ___何ですか。',
    english: 'What is this?',
    particle: 'は',
  },
  {
    japanese: '猫___好きです。',
    english: 'I like cats.',
    particle: 'が',
  },
  {
    japanese: '水___飲みます。',
    english: 'I drink water.',
    particle: 'を',
  },
  {
    japanese: '日本___行きます。',
    english: 'I will go to Japan.',
    particle: 'に',
  },
  {
    japanese: '学校___行きます。',
    english: 'I will go to school.',
    particle: 'へ',
  },
  {
    japanese: '図書館___勉強します。',
    english: 'I study at the library.',
    particle: 'で',
  },
  {
    japanese: '私___友達。',
    english: 'My friend.',
    particle: 'の',
  },
  {
    japanese: '友達___話します。',
    english: 'I talk with a friend.',
    particle: 'と',
  },
  {
    japanese: '私___行きます。',
    english: 'I will also go.',
    particle: 'も',
  },
  {
    japanese: '家___駅まで歩きます。',
    english: 'I walk from the house to the station.',
    particle: 'から',
  },
  {
    japanese: '9時___5時まで働きます。',
    english: 'I work from 9 o\'clock to 5 o\'clock.',
    particle: 'まで',
  },
];
