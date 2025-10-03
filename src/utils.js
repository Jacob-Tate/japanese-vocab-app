// src/utils.js

// Groups morphemes from kuromoji into logical chunks for games.
export const chunkJapanese = (tokens) => {
  if (!tokens || tokens.length === 0) return [];
  
  return tokens.reduce((acc, token) => {
    const lastChunk = acc[acc.length - 1];
    
    // Punctuation should always be its own chunk.
    if (token.pos === '記号') { // Symbol/Punctuation
      acc.push(token.surface_form);
      return acc;
    }

    // These are parts of speech that should be attached to the previous word.
    // Particles (助詞) are excluded, so they become separate chunks.
    const shouldMerge = 
        token.pos === '助動詞' || // Auxiliary Verb (ます, ない, た)
        (token.pos === '名詞' && token.pos_detail_1 === '接尾'); // Suffix (さん, ちゃん)
    
    // If there's a previous chunk, it's not punctuation, and the current token should be merged...
    if (lastChunk && shouldMerge && !lastChunk.match(/^[。、！？]$/)) {
        acc[acc.length - 1] = lastChunk + token.surface_form;
    } else {
      // Otherwise, start a new chunk.
      acc.push(token.surface_form);
    }
    return acc;
  }, []);
};
