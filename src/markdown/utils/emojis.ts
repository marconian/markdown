import emojilib from 'emojilib';

const emojis: Record<string, keyof typeof emojilib> = Object.assign(
    {},
    ...(Object.keys(emojilib) as (keyof typeof emojilib)[]).flatMap((x) => emojilib[x].map((v) => ({ [v]: x }))),
);

export default emojis;
