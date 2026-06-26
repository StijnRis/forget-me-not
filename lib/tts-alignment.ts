export type CharacterAlignment = {
  characters: string[];
  characterStartTimesSeconds: number[];
  characterEndTimesSeconds: number[];
};

export type WordTiming = {
  word: string;
  start: number;
  end: number;
};

export function alignmentFromApi(alignment: {
  characters: string[];
  character_start_times_seconds?: number[];
  character_end_times_seconds?: number[];
  characterStartTimesSeconds?: number[];
  characterEndTimesSeconds?: number[];
}): CharacterAlignment {
  return {
    characters: alignment.characters,
    characterStartTimesSeconds:
      alignment.characterStartTimesSeconds ??
      alignment.character_start_times_seconds ??
      [],
    characterEndTimesSeconds:
      alignment.characterEndTimesSeconds ??
      alignment.character_end_times_seconds ??
      [],
  };
}

export function processAlignments(alignment: CharacterAlignment): WordTiming[] {
  const calculatedWords: WordTiming[] = [];
  let currentWord = '';
  let wordStartTime = 0;
  let isBuildingWord = false;

  for (let i = 0; i < alignment.characters.length; i++) {
    const char = alignment.characters[i];
    const start = alignment.characterStartTimesSeconds[i];

    if (char.trim() !== '') {
      if (!isBuildingWord) {
        wordStartTime = start;
        isBuildingWord = true;
      }
      currentWord += char;
    } else if (isBuildingWord) {
      calculatedWords.push({
        word: currentWord,
        start: wordStartTime,
        end: alignment.characterEndTimesSeconds[i - 1] ?? start,
      });
      currentWord = '';
      isBuildingWord = false;
    }
  }

  if (isBuildingWord && currentWord.length > 0) {
    calculatedWords.push({
      word: currentWord,
      start: wordStartTime,
      end:
        alignment.characterEndTimesSeconds[
          alignment.characterEndTimesSeconds.length - 1
        ] ?? wordStartTime,
    });
  }

  return calculatedWords;
}
