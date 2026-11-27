import { FEATURED_PHOTO } from '../gallery.js?v=1';

export function buildExperience(kit) {
  const { THREE, collection, mesh, box, material, texture, image, sculpt, register, status, invalidate } = kit;
  const group = new THREE.Group();
  const photos = collection.items;
  const entryIndex = Math.max(0, photos.findIndex(item => item.id === FEATURED_PHOTO));
  const bronze = material('#836f47', 0.42, 0.65);
  const edge = material('#35322a', 0.47, 0.42);
  const charcoal = material('#211f19', 0.78);
  const backing = material('#696754', 0.89);
  const base = material('#575c4d', 0.86);
  const illuminated = new THREE.MeshBasicMaterial({ color: '#e2c995', toneMapped: false });

  sculpt.rounded(8.6, 0.23, 3.2, base, group, [0, 0.12, 0.08], 0.08);
  box(7.35, 0.11, 2.16, charcoal, 0, 0.26, 0.03, group);
  box(6.8, 0.09, 0.04, bronze, 0, 0.32, 1.14, group);
  for (const x of [-3.48, 3.48]) {
    box(0.16, 4.96, 0.52, edge, x, 2.75, -0.48, group);
    box(0.56, 0.13, 0.92, bronze, x, 0.38, -0.46, group);
    box(0.05, 4.59, 0.035, illuminated, x * 0.984, 2.93, -0.203, group).castShadow = false;
  }
  box(7.09, 4.99, 0.15, backing, 0, 2.97, -0.34, group);
  sculpt.rounded(6.82, 4.82, 0.24, edge, group, [0, 2.98, -0.10], 0.07);
  box(6.48, 4.49, 0.035, charcoal, 0, 2.98, 0.042, group);
  box(6.43, 0.045, 0.042, bronze, 0, 5.225, 0.064, group);
  box(6.43, 0.045, 0.042, bronze, 0, 0.735, 0.064, group);
  for (const x of [-3.22, 3.22]) box(0.024, 4.49, 0.042, bronze, x, 2.98, 0.063, group);

  const print = image(photos[entryIndex].image, 1, 1, group);
  print.position.set(0, 2.98, 0.11);
  print.castShadow = false;
  const key = new THREE.PointLight('#ffe4b0', 19, 7);
  key.position.set(0, 5.3, 2.45);
  group.add(key);

  let index = entryIndex;
  let light = 1;
  let dragDistance = 0;
  function setFrame(next) {
    index = (next + photos.length) % photos.length;
    const item = photos[index];
    const ratio = item.width / item.height;
    const height = Math.min(4.38, 6.34 / ratio);
    print.scale.set(height * ratio, height, 1);
    print.material.map = texture(item.image);
    print.material.needsUpdate = true;
    status(item.title + ' · ' + (index + 1) + ' / ' + photos.length);
    invalidate();
  }
  function setLight(value) {
    light = THREE.MathUtils.clamp(value, 0.46, 1);
    print.material.color.setScalar(light);
    slider.position.x = (light - 0.73) * 1.64;
    status('进光 ' + Math.round(light * 100) + '%');
    invalidate();
  }
  function step(delay) {
    setFrame(index + delay);
  }
  for (const [direction, id, label] of [[-1, 'prev-frame', '上一张照片'], [1, 'next-frame', '下一张照片']]) {
    const x = direction * 3.69;
    const paddle = sculpt.rounded(0.38, 0.92, 0.51, bronze, group, [x, 2.8, 0.16], 0.09);
    box(0.21, 0.026, 0.013, charcoal, x, 2.8, 0.412, group);
    for (const tilt of [-1, 1]) {
      const serif = box(0.12, 0.026, 0.013, charcoal, x + direction * 0.072, 2.8 + tilt * 0.035, 0.412, group);
      serif.rotation.z = -direction * tilt * 0.68;
    }
    register(paddle, {
      id, label, anchor: [0, 0.28, 0.25], hint: '点按拨片换片',
      onClick: () => step(direction),
    });
  }
  register(print, {
    id: 'view-print', label: '查看当前照片', hint: '打开大图和原始题注',
    onClick: () => kit.onSelect('photo', index),
  });

  box(1.37, 0.14, 0.21, edge, 0, 0.51, 1.04, group);
  const slider = mesh(new THREE.SphereGeometry(0.16, 24, 12), bronze, 0.44, 0.53, 1.17, group);
  register(slider, {
    id: 'light', label: '透光滑杆', hint: '向左或向右拖动，调整照片亮度',
    onDown: () => { dragDistance = 0; },
    onDrag: ({ dx }) => { dragDistance += Math.abs(dx); setLight(light + dx * 0.007); },
    onClick: () => { if (dragDistance < 4) setLight(light > 0.75 ? 0.58 : 1); },
  });

  setFrame(index);
  return {
    group,
    focus: new THREE.Vector3(0.03, 2.66, 0.05),
    interact(action, value) {
      if (action === 'select' && photos[value]) setFrame(value);
      if (action === 'reset') {
        setLight(1);
        setFrame(entryIndex);
      }
    },
    getState: () => ({ index, light, title: photos[index].title }),
  };
}
