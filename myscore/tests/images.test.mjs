import test from 'node:test';
import assert from 'node:assert/strict';
import { thumbnail, imageOrigins } from '../images.mjs';

test('ESPN headshots and crests use bounded, proportion-preserving thumbnails', () => {
  for (const path of ['/i/headshots/nba/players/full/4397189.png', '/i/teamlogos/nba/500/dal.png']) {
    for (const width of [96, 128, 192]) {
      const resized = new URL(thumbnail(`https://a.espncdn.com${path}`, width));
      assert.equal(resized.origin, 'https://a.espncdn.com');
      assert.equal(resized.pathname, '/combiner/i');
      assert.equal(resized.searchParams.get('img'), path);
      assert.equal(resized.searchParams.get('w'), String(width));
      assert.equal(resized.searchParams.has('h'), false);
    }
  }
});

test('5E source portraits use the verified OSS resize and WebP transform', () => {
  const source = 'https://oss.5eplay.com/cloudx/p/sport/csgo/player/example.png';
  assert.equal(new URL(thumbnail(source)).searchParams.get('x-oss-process'), 'image/resize,w_96/format,webp');
});

test('unknown, already resized, signed and non-photo URLs stay unchanged', () => {
  const sources = [
    'https://img.crawler.qq.com/lolwebvideo/example/0',
    'https://game.gtimg.cn/images/lol/act/img/item/1001.png',
    'https://resources.premierleague.com/premierleague/photos/players/250x250/p1.png',
    'https://a.espncdn.com/i/venues/nba/stadium.jpg',
    'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/full/1.png&w=96',
    'https://oss.5eplay.com/cloudx/photo.png?signature=keep',
    'https://a.espncdn.com.example.org/i/headshots/nba/full/1.png',
    'http://a.espncdn.com/i/headshots/nba/full/1.png', '', 'not-a-url',
  ];
  for (const source of sources) assert.equal(thumbnail(source), source);
  const source = 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png';
  assert.equal(thumbnail(source, 9999), source);
});

test('connection hints cover selected sources once, without unrelated CDNs', () => {
  assert.deepEqual(imageOrigins(['nba', 'epl', 'nfl']), ['https://a.espncdn.com']);
  assert.deepEqual(imageOrigins(['lol']), ['https://img.crawler.qq.com', 'https://game.gtimg.cn']);
  assert.deepEqual(imageOrigins(['cs2']), ['https://oss.5eplay.com']);
  assert.equal(imageOrigins(['nba', 'epl', 'lol', 'cs2', 'lol']).length, 4);
  assert.deepEqual(imageOrigins([]), []);
});
