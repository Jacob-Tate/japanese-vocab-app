// src/conjugation.js

// A list of common conjugation forms with their display names
export const conjugationForms = [
  { id: 'masu', name: 'Masu Form (Polite)' },
  { id: 'nai', name: 'Nai Form (Plain Negative)' },
  { id: 'te', name: 'Te Form' },
  { id: 'ta', name: 'Ta Form (Plain Past)' },
  { id: 'potential', name: 'Potential Form ("can do")' },
  { id: 'passive', name: 'Passive Form' },
];

// A list of verbs for practice
export const verbs = [
  // --- Ichidan Verbs ---
  {
    dictionary: '食べる',
    english: 'to eat',
    type: 'ichidan',
    conjugations: {
      masu: '食べます',
      nai: '食べない',
      te: '食べて',
      ta: '食べた',
      potential: '食べられる',
      passive: '食べられる',
    },
  },
  {
    dictionary: '見る',
    english: 'to see',
    type: 'ichidan',
    conjugations: {
      masu: '見ます',
      nai: '見ない',
      te: '見て',
      ta: '見た',
      potential: '見られる',
      passive: '見られる',
    },
  },
  {
    dictionary: '起きる',
    english: 'to wake up',
    type: 'ichidan',
    conjugations: {
        masu: '起きます',
        nai: '起きない',
        te: '起きて',
        ta: '起きた',
        potential: '起きられる',
        passive: '起きられる',
    },
  },
  // --- Godan Verbs ---
  {
    dictionary: '書く',
    english: 'to write',
    type: 'godan',
    conjugations: {
      masu: '書きます',
      nai: '書かない',
      te: '書いて',
      ta: '書いた',
      potential: '書ける',
      passive: '書かれる',
    },
  },
  {
    dictionary: '飲む',
    english: 'to drink',
    type: 'godan',
    conjugations: {
      masu: '飲みます',
      nai: '飲まない',
      te: '飲んで',
      ta: '飲んだ',
      potential: '飲める',
      passive: '飲まれる',
    },
  },
  {
    dictionary: '話す',
    english: 'to speak',
    type: 'godan',
    conjugations: {
      masu: '話します',
      nai: '話さない',
      te: '話して',
      ta: '話した',
      potential: '話せる',
      passive: '話される',
    },
  },
   {
    dictionary: '買う',
    english: 'to buy',
    type: 'godan',
    conjugations: {
      masu: '買います',
      nai: '買わない',
      te: '買って',
      ta: '買った',
      potential: '買える',
      passive: '買われる',
    },
  },
  // --- Irregular Verbs ---
  {
    dictionary: 'する',
    english: 'to do',
    type: 'irregular',
    conjugations: {
      masu: 'します',
      nai: 'しない',
      te: 'して',
      ta: 'した',
      potential: 'できる',
      passive: 'される',
    },
  },
  {
    dictionary: '来る',
    english: 'to come',
    type: 'irregular',
    conjugations: {
      masu: '来ます',
      nai: '来ない',
      te: '来て',
      ta: '来た',
      potential: '来られる',
      passive: '来られる',
    },
  },
];
