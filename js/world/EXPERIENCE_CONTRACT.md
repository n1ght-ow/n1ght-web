# 第二轮：可直接操作的空间装置

本轮不是装饰摆件。每件装置必须有复杂的层叠结构、独立的活动机构、至少两种直接操作与明显的操作结果；不能把主要玩法做成打开详情弹窗。

## 模块接口

每个文件仅导出 `export function buildExperience(kit)`，返回：

```js
{ group, focus: new THREE.Vector3(0, 2.4, 0),
  update(time, dt, active), interact(action, index),
  getState(), setActive(active), dispose() }
```

`group` 为独立 THREE.Group。y=0 是装置脚底；主体半径尽量不超过 4.8、高度不超过 8。可以局部悬挑至 5.6。不要再做统一圆形底盘，不要给整个建筑套外盒。可有自己的分裂地层、悬浮支座和非现实结构。视觉应比第一轮至少多一个数量级的结构层次：至少三层建筑/机构，曲面、细肋、传动或局部纹理，重复细节用实例化。

`kit` 保留已有 `{THREE,collection,mesh,box,cylinder,material,texture,image,line,label,brass,stone,cream,walnut,green,dark,onSelect,onItemSelect}`。基础 helper 签名与原引擎相同，位置参数为 x,y,z,parent。

新增 `kit.sculpt`：

- `rounded(w,h,d,mat,parent,position=[0,0,0],radius=.08)`：倒角实体。
- `lathe(profile,mat,parent,position=[0,0,0],segments=64)`：profile 是 [[radius,y],...]。
- `tube(points,radius,mat,parent,segments=64,sides=8)`：points 为数组坐标或 Vector3。
- `ring(radius,tube,mat,parent,position=[0,0,0],arc=Math.PI*2)`：XY 面内圆环，返回 Mesh。
- `gear(radius,depth,teeth,mat,parent,position=[0,0,0])`：XY 面齿轮，绕 z 轴转动。
- `surface(fn,uSegments,vSegments,mat,parent)`：fn(u,v) 返回 [x,y,z] 或 Vector3。
- `instances(geometry,mat,placements,parent)`：placements 为 `{position:[x,y,z],rotation:[rx,ry,rz],scale:[sx,sy,sz]}` 数组，scale 也可是数字，返回 InstancedMesh。
- `text(text,w,h,parent,options={})`：多行排版平面，options 支持 background（null 为透明）、color、fontSize、padding、align、serif。

`kit.material`、stone、walnut 等由主模型提供含微表面纹理的材质和环境反射。可按自己的装置另外建材质或着色器。不要新依赖、外部请求或改 vendor。

## 直接操作

```js
kit.register(handleMeshOrGroup, {
  id: 'aperture', label: '光圈环', hint: '左右拖动，控制十二片光圈叶片',
  onDown(ctx) {},
  onDrag({dx,dy,totalX,totalY,localPoint,delta,event}) {},
  onUp(ctx) {},
  onClick(ctx) {},
  onKey(key) {} // 可选；键盘辅助由主引擎提供默认拖拽步进
});
```

- dx/dy 是本次事件的增量 CSS 像素；totalX/totalY 从按下累计。onDrag 优先使用 dx/dy 累加状态，避免每次键盘步进重置。
- `anchor: [x,y,z]` 是注册对象局部坐标中的真实握持点。变形曲面可提供 `getAnchor()` 返回当前局部 Vector3 或数组，场景提示随曲面更新。
- point 是世界坐标；localPoint 与 delta 位于注册对象 parent 坐标系，delta 是从按下起的总位移。拖拽在初始命中点的屏幕平行面上计算。
- 注册的物体会阻止镜头旋转，因此只登记真实机关/需要拖拽的表面；空白处仍旋转镜头。
- 可用透明代理体增大细小零件的命中区；保持 visible=true，使用透明材质 opacity=0、depthWrite=false，不能以 visible=false 隐藏代理。
- 拾取会检查实体遮挡，代理不能越过机身代替实际外露握柄；前侧需要真实操作净空。透明代理与透光效果不投射不透明阴影。
- onClick 操作装置状态，**不要直接 onSelect**，除非被点的是已解锁/已展开的真实作品本体。
- `kit.status('光圈 f/4 · 已显影第 2 张')`：给当前模型提供简洁的人话反馈，不能每帧刷屏。
- `kit.invalidate()` 请求重绘；引擎在 active 时会调用 update。
- `kit.reducedMotion()` 返回偏好；减少动态时交互结果应立即可见。可在操作内同步更新主状态，动画只是追随。
- `interact('select',index)` 用于目录选择；`interact('reset')` 复位机构；其余自定义 action 可选。
- `getState()` 返回可读、无循环引用的状态，包含主要数值和已完成阶段，便于验证真实交互效果。
- 重复点击/拖拽需要可逆、可重玩，不做一次性空动画。

## 策展与声音

策展模块额外可用 `kit.getCuratedItems()`、`kit.moveCurated(id,targetIndex)`、`kit.onItemSelect(item)`、`kit.requestCuration()`。moveCurated 会改变实际策展顺序并通知主界面；refresh 时接受实际七件作品数组。

音乐可用浏览器 Web Audio 制作明确称为「装置音色」的短音；只能在用户点击/拖拽后初始化或 resume，离开模块必须停止/暂停声音。不能冒充馆藏歌曲的音频。

## 验收

实际编辑文件；执行 node --check。报告真实机关 ID、操作方式、状态字段与几何规模。不要编辑其他工人的文件、引擎、UI、说明或数据，不提交或推送，不另起预览服务。
