// src/counters.js
// Data for Japanese counters, including irregular readings for numbers 1-10.
export const counters = [
  {
    counter: '本',
    reading: 'hon',
    uses: 'long, cylindrical objects',
    items: ['pencils', 'bottles', 'trees', 'umbrellas', 'guitars'],
    readings: {
      1: 'ippon', 2: 'nihon', 3: 'sanbon', 4: 'yonhon', 5: 'gohon',
      6: 'roppon', 7: 'nanahon', 8: 'happon', 9: 'kyuuhon', 10: 'juppon',
    },
  },
  {
    counter: '人',
    reading: 'nin',
    uses: 'people',
    items: ['students', 'friends', 'people', 'customers'],
    readings: {
      1: 'hitori', 2: 'futari', 3: 'sannin', 4: 'yonin', 5: 'gonin',
      6: 'rokunin', 7: 'nananin', 8: 'hachinin', 9: 'kyuunin', 10: 'juunin',
    },
  },
  {
    counter: '匹',
    reading: 'hiki',
    uses: 'small animals (insects, fish, cats, dogs)',
    items: ['cats', 'dogs', 'fish', 'insects'],
    readings: {
      1: 'ippiki', 2: 'nihiki', 3: 'sanbiki', 4: 'yonhiki', 5: 'gohiki',
      6: 'roppiki', 7: 'nanahiki', 8: 'happiki', 9: 'kyuuhiki', 10: 'juppiki',
    },
  },
  {
    counter: '枚',
    reading: 'mai',
    uses: 'flat, thin objects',
    items: ['sheets of paper', 'stamps', 'shirts', 'plates'],
    readings: {
      1: 'ichimai', 2: 'nimai', 3: 'sanmai', 4: 'yonmai', 5: 'gomai',
      6: 'rokumai', 7: 'nanamai', 8: 'hachimai', 9: 'kyuumai', 10: 'juumai',
    },
  },
  {
    counter: '個',
    reading: 'ko',
    uses: 'small and round objects',
    items: ['apples', 'eggs', 'pieces of candy', 'boxes'],
    readings: {
      1: 'ikko', 2: 'niko', 3: 'sanko', 4: 'yonko', 5: 'goko',
      6: 'rokko', 7: 'nanako', 8: 'hakko', 9: 'kyuuko', 10: 'jukko',
    },
  },
  {
    counter: '冊',
    reading: 'satsu',
    uses: 'bound objects',
    items: ['books', 'magazines', 'notebooks'],
    readings: {
      1: 'issatsu', 2: 'nisatsu', 3: 'sansatsu', 4: 'yonsatsu', 5: 'gosatsu',
      6: 'rokusatsu', 7: 'nanasatsu', 8: 'hassatsu', 9: 'kyuusatsu', 10: 'jussatsu',
    },
  },
  {
    counter: '歳',
    reading: 'sai',
    uses: 'age',
    items: ['years old'],
    readings: {
      1: 'issai', 2: 'nisai', 3: 'sansai', 4: 'yonsai', 5: 'gosai',
      6: 'rokusai', 7: 'nanasai', 8: 'hassai', 9: 'kyuusai', 10: 'jussai',
    },
  },
  {
    counter: '分',
    reading: 'fun',
    uses: 'minutes',
    items: ['minutes'],
    readings: {
      1: 'ippun', 2: 'nifun', 3: 'sanpun', 4: 'yonpun', 5: 'gofun',
      6: 'roppun', 7: 'nanafun', 8: 'happun', 9: 'kyuufun', 10: 'juppun',
    },
  },
];
