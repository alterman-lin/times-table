# times-table｜甜心少女的九九乘法大冒險

一個給國小學生練習九九乘法的網頁小遊戲。純前端、零建置、零伺服器依賴，
下載後雙擊 `index.html` 就能玩，也可以直接部署到任何靜態網頁空間
（GitHub Pages、Netlify、學校內部網站…）。

## 遊戲玩法

1. **建立角色**：輸入名字，從三位少女角色中選一位當自己的化身。
2. **六個關卡**：難度漸進，是非題 → 選擇題 → 輸入題，各跑一輪不限時、
   再跑一輪限時版，共 6 關，每關 10 題、答對 7 題以上算過關。
3. **金幣與商店**：過關可以領金幣，到商店購買衣服／裙子／褲子／包包／
   飾品／鞋子六個部位的服裝，即時換裝、可退貨。
4. **失敗與結局**：某一關沒過可以選擇重新挑戰或結束本局（角色會變成
   落魄樣）；六關全破會看到完整裝扮的慶祝結局，還有兔子和小熊一起入鏡。

題目只會出現 2～9 的乘法（不考 ×1，練習價值較低），每次進關卡都會重新
隨機出題、不重複。

## 專案結構

```
index.html          遊戲主頁面（所有畫面用 <section> 切換）
css/style.css        可愛粉色系格紋風格的樣式
js/
  questions.js        九九乘法題目產生器
  storage.js          localStorage 存讀，支援多玩家
  shop.js             商店品項資料
  character.js        角色分層渲染（換裝疊圖邏輯）
  game.js             遊戲狀態機（關卡、計分、商店、結局）
assets/
  raw/                 Gemini 產生的原始插畫
  processed/           去背後的高解析度素材
  final/               縮小壓縮後、實際遊戲使用的素材
tools/
  bg_remove.py         去背工具（保留角色本身的白色區塊）
  extract_layer.py     從兩張姿勢相同的圖片，萃取出單一服裝的透明圖層
  finalize_asset.py    縮圖＋調色盤壓縮，產出遊戲用的最終素材
doc/                    美術風格設計稿（Claude Design Components 畫布）
```

## 本地開發

不需要任何建置工具，用任何靜態伺服器打開專案根目錄即可，例如：

```bash
python -m http.server 8935
```

再開瀏覽器連到 `http://localhost:8935`。

## 美術資產處理流程

新增角色或服裝時，`assets/raw/` 放 Gemini 產生的原始圖，`tools/bg_remove.py`
去背後存到 `assets/processed/`，最後用 `tools/finalize_asset.py` 縮圖壓縮到
`assets/final/`（這個資料夾才是遊戲實際載入的素材）。
