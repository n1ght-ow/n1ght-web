export const FEATURED_PHOTO = 'photo-22';

export const WINGS = [
  { name: '图像', rooms: ['photo', 'paintings'] },
  { name: '文字与声音', rooms: ['books', 'poems', 'music'] },
  { name: '银幕与赛场', rooms: ['films', 'series', 'games', 'sport'] },
];

export const PRIMARY_CONTROLS = {
  poems: ['ink-pool', 'scroll', 'moon', 'reading-page'],
  music: ['resonance-crank', 'frequency-arm', 'string-1', 'pressure-key'],
  films: ['projection-film', 'clip-slot-1', 'clip-slot-2', 'clip-slot-3', 'splice-lever', 'projection-lens'],
  series: ['timeline-scroll', 'branch-fork-1', 'branch-fork-2', 'counterflow-pendulum'],
  games: ['road-joint-0', 'road-joint-1', 'road-joint-2', 'road-joint-3', 'road-joint-4', 'traveler-orb'],
  sport: ['launch-ball', 'gravity-ring', 'pressure-pulse', 'sport-collection-card'],
  curate: ['layout-dial', 'curation-invitation', 'lift-actuator-0'],
};

export const ROOMS = {
  photo: { name: '摄影', title: '摄影透光台', intro: '拨动透光片，沿着天色翻看照片。', hint: '使用照片两侧的拨片换片。轻点照片，即可查看大图。', size: 8.4, span: 9.3, yaw: 0.12, pitch: 0.13, color: '#41473b' },
  paintings: { name: '绘画', title: '画室', intro: '把画面展开，再沿着光线将它合拢。', hint: '拖动解构机构，让画面展开或合拢。', size: 9.6, span: 10.2, yaw: 0.15, pitch: 0.20, color: '#554438' },
  books: { name: '书籍', title: '阅览室', intro: '从藏书中抽出一本书。', hint: '点两侧拨片换书，用中间拉手开卷。', size: 9.0, span: 9.4, yaw: 0.14, pitch: 0.19, color: '#4d4836' },
  poems: { name: '诗歌', title: '诗室', intro: '沿着纸卷读到下一节。', hint: '轻点墨池或拖动纸卷，继续读下去。', size: 9.4, span: 10.0, yaw: 0.18, pitch: 0.22, color: '#3d4545' },
  music: { name: '音乐', title: '唱片室', intro: '拨动展品里的弦，或在馆藏里找一首歌。', hint: '拨弦会发出装置音色；馆藏详情可打开对应歌曲。', size: 9.7, span: 10.6, yaw: 0.17, pitch: 0.21, color: '#514337' },
  films: { name: '电影', title: '放映室', intro: '拖动胶片，选出三部想放在一起看的电影。', hint: '滑动胶片换片，再用剪辑槽编排片单。', size: 8.8, span: 9.9, yaw: 0.16, pitch: 0.22, color: '#48403b' },
  series: { name: '剧集', title: '时间长廊', intro: '沿时间轨道翻看剧集及观看笔记。', hint: '拖动卷轴，沿着剧集目录前进。', size: 10.3, span: 10.7, yaw: 0.22, pitch: 0.27, color: '#464742' },
  games: { name: '游戏', title: '路径实验室', intro: '转动道路关节，接通一条可以走完的路。', hint: '让各段道路对齐，再送旅行光球通过。', size: 9.4, span: 10.8, yaw: 0.29, pitch: 0.42, color: '#464b39' },
  sport: { name: '体育', title: '看台', intro: '从看台俯视球场，或为自己投一球。', hint: '按住球拖动瞄准，松手投球。', size: 11.3, span: 11.7, yaw: 0.24, pitch: 0.62, color: '#3e4d41' },
  curate: { name: '策展', title: '我的展览', intro: '把喜欢的作品聚在一起，排一场自己的展览。', hint: '在场景中拖动画框，或从展览清单调整顺序。', size: 10.9, span: 10.8, yaw: 0.14, pitch: 0.32, color: '#514338' },
};
