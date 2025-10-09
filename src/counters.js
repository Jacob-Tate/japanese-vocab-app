// src/counters.js
// Data for Japanese counters, including irregular readings for numbers 1-10.
export const counters = [
  {
    counter: '本',
    reading: 'hon',
    uses: 'long, cylindrical objects',
    items: ['pencils', 'bottles', 'trees', 'umbrellas', 'guitars'],
    readings: {
      1: 'いっぽん', 2: 'にほん', 3: 'さんぼん', 4: 'よんほん', 5: 'ごほん',
      6: 'ろっぽん', 7: 'ななほん', 8: 'はっぽん', 9: 'きゅうほん', 10: 'じゅっぽん',
    },
  },
  {
    counter: '人',
    reading: 'nin',
    uses: 'people',
    items: ['students', 'friends', 'people', 'customers'],
    readings: {
      1: 'ひとり', 2: 'ふたり', 3: 'さんにん', 4: 'よにん', 5: 'ごにん',
      6: 'ろくにん', 7: 'ななにん', 8: 'はちにん', 9: 'きゅうにん', 10: 'じゅうにん',
      14: 'じゅよにん', 18: 'じゅうはちにん', 25: 'にじゅうごにん', 100: 'ひゃくにん', 
      104: 'ひゃくよにん', 124: 'ひゃくにじゅうよにん'
    },
  },
  {
    counter: '匹',
    reading: 'hiki',
    uses: 'small animals (insects, fish, cats, dogs)',
    items: ['cats', 'dogs', 'fish', 'insects'],
    readings: {
      1: 'いっぴき', 2: 'にひき', 3: 'さんびき', 4: 'よんひき', 5: 'ごにき',
      6: 'ろっぴき', 7: 'ななひき', 8: 'はっぴき', 9: 'きゅうにき', 10: 'じゅっぴき',
    },
  },
  {
    counter: '枚',
    reading: 'mai',
    uses: 'flat, thin objects',
    items: ['sheets of paper', 'stamps', 'shirts', 'plates'],
    readings: {
      1: 'いちまい', 2: 'にまい', 3: 'さんまい', 4: 'よんまい', 5: 'ごまい',
      6: 'ろくまい', 7: 'ななまい', 8: 'はちまい', 9: 'きゅうまい', 10: 'じゅうまい',
    },
  },
  {
    counter: '個',
    reading: 'ko',
    uses: 'small and round objects',
    items: ['apples', 'eggs', 'pieces of candy', 'boxes'],
    readings: {
      1: 'いっこ', 2: 'にこ', 3: 'さんこ', 4: 'よんこ', 5: 'ごこ',
      6: 'ろっこ', 7: 'ななこ', 8: 'はっこ', 9: 'きゅうこ', 10: 'じゅっこ',
    },
  },
  {
    counter: '冊',
    reading: 'satsu',
    uses: 'bound objects',
    items: ['books', 'magazines', 'notebooks'],
    readings: {
      1: 'いっさつ', 2: 'にさつ', 3: 'さんさつ', 4: 'よんさつ', 5: 'ごさつ',
      6: 'ろくさつ', 7: 'ななさつ', 8: 'はっさつ', 9: 'きゅうさつ', 10: 'じゅっさつ',
    },
  },
  {
    counter: '歳',
    reading: 'sai',
    uses: 'age',
    items: ['years old'],
    readings: {
      1: 'いっさい', 2: 'にさい', 3: 'さんさい', 4: 'よんさい', 5: 'ごさい',
      6: 'ろくさい', 7: 'ななさい', 8: 'はっさい', 9: 'きゅうさい', 10: 'じゅっさい',
    },
  },
  {
    counter: '分',
    reading: 'fun',
    uses: 'minutes',
    items: ['minutes'],
    readings: {
      1: 'いっぷん', 2: 'にふん', 3: 'さんぷん', 4: 'よんぷん', 5: 'ごふん',
      6: 'ろっぷん', 7: 'ななふん', 8: 'はっぷん', 9: 'きゅうふん', 10: 'じゅっぷん',
    },
  },
];
