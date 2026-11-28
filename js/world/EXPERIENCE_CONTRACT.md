# 展品模块约定

新版 /3d/ 将装置放在同一个展厅。主场景管理相机、展墙、灯光、模型拾取、状态提示、资源路径和访问时加载，装置模块提供各自的 3D 内容与互动。

## 模块接口

每个展品导出 buildExperience(kit)，返回对象中的 group 为 THREE.Group，地面在 y=0。focus 提供默认镜头中心，默认缩放、角度和手机画幅在 gallery.js 中配置。展品主体按实际可视范围定尺寸，主要操作入口应可从默认视角找到。update(time, dt, active)、interact(action, value)、getState()、setActive(active)、dispose()、refreshTextures() 按展品需求提供。

kit 提供 THREE、collection、mesh、box、cylinder、material、texture、image、line、label、sculpt 和共享材质。用 collection.items 读取真实作品。资源沿用 texture、image 或 assetURL 解析，兼容部署子路径。按当前场景选少量材质，优先给作品与直接操作空间。只有展品自己的局部灯或渲染需要时才新增相应对象。

## 操作

- kit.register(object, descriptor) 注册真实可交互对象。descriptor 提供唯一 id、中文 label、hint，可选本地坐标 anchor 或 getAnchor()，并按动作实现 onDown、onDrag、onUp、onClick、onKey。
- onDrag 的 dx/dy 是 CSS 像素增量，totalX/totalY 是本次拖动累计量。localPoint 和 delta 位于操作物父级坐标系。应让键盘步进、触摸和拖拽获得相同的操作结果。
- 引擎会检查实体遮挡。机关前留足操作空间。透明命中辅助体可以扩大小把手的点击范围，材质保持透明且不写深度。
- interact('select', index) 同步馆藏位置，interact('reset') 复位装置。kit.status(message) 提供简短状态，kit.invalidate() 请求重绘。getState() 返回可验证的纯数据。kit.reducedMotion() 开启时，主要结果直接呈现。
- kit.onSelect(category, index) 打开实际作品。策展还可以使用 getCuratedItems、moveCurated、onItemSelect、requestCuration。
