# sport-sources

SPORT 面板那五张照片的**未降采样原图**。站点从不加载这里的任何文件：它只是
`sport/` 里五张 renditions 的源。

`archive/image-refresh/build-images.py` 对 `sport/` 是**就地替换**（见那份 README 的
「Sources are never modified in place except where the file IS the rendition」），
所以 `sport/*.webp` 是产物、不是源。要重出更大的一档、或换一种编码，用这里的文件。

## 来历

- 2026-09-14 收进 `Desktop\sport\`（五张原图，含原始文件名）。
- 2026-09-21 `build-images.py` 把站点用的 1600px webp 写进 `sport/`。
- 2026-09-14 15:50 建的桌面临时对照页 `Desktop\sport-compare\` 里 `img/` 与这五张
  **逐字节相同**（其中 `team spirit.jpg` 当时已改名 `spirit.jpg`）；那张对照页
  （Framer「image animation」移植到本站语言的实验 + 5 个 iframe 几何探针）已于
  2026-09 连同 `Desktop\sport\` 一起清理，对照页进了回收站，原图移到这里。

| 文件 | 尺寸 | 原桌面文件名 | 站点 rendition |
| --- | --- | --- | --- |
| `mancity.jpg` | 1500x500 | `mancity.jpg` | `sport/mancity.webp` 1500x500（原生尺寸，脚本从不放大） |
| `mclaren.jpg` | 1920x1280 | `mclaren.jpg` | `sport/mclaren.webp` 1600x1067 |
| `ravens.webp` | 2560x1440 | `Ravens.webp` | `sport/ravens.webp` 1600x900 |
| `spirit.jpg` | 4489x2994 | `team spirit.jpg` | `sport/spirit.webp` 1600x1067 |
| `spurs.webp` | 1920x1280 | `spurs.webp` | `sport/spurs.webp` 1600x1067 |

文件名已统一成与 `sport/` 一致的 slug（站点按 slug 取图，队徽在 `logos/`）。

## 校验

    name          size       md5
    mancity.jpg   434379     E905170E1055967D439063E4F0594B0B
    mclaren.jpg   890091     1A2A29F480964FD193079F0FA8429445
    ravens.webp   331356     0BCC68503C7C24D85B3FD814B4EFB3DA
    spirit.jpg    663687     1D006951992815F1D73A99B0B866C309
    spurs.webp    304388     44C758C5B58AF0E98B04C639E762CC4E

## 重新生成 rendition

把这里的源文件放回 `sport/`（同名 slug）再跑：

    python -m pip install --target %TEMP%\pytools pillow
    set PYTHONPATH=%TEMP%\pytools
    python -B archive/image-refresh/build-images.py --only=sport

写完记得给 `index.html` 里那五张 `<img src="sport/*.webp">` 的缓存版本号 +1（若带 `?v=`）。
