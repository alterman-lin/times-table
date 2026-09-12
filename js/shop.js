/* ===== 商店資料：六個裝備欄位的品項、價格、對應圖層檔名 ===== */
const SHOP = {
  topId: [
    { id: 'strawberry', name: '草莓上衣', price: 25, img: 'top_strawberry.png' },
    { id: 'white_lace', name: '白色蕾絲上衣', price: 35, img: 'top_white_lace.png' },
  ],
  skirtId: [
    { id: 'plaid', name: '格紋裙', price: 25, img: 'skirt_plaid.png' },
    { id: 'tutu', name: '蓬蓬紗裙', price: 35, img: 'skirt_tutu.png' },
  ],
  pantsId: [
    { id: 'bloomers', name: '泡泡褲', price: 20, img: 'pants_bloomers.png' },
    { id: 'overalls', name: '吊帶褲', price: 30, img: 'pants_overalls.png' },
  ],
  bagId: [
    { id: 'heart', name: '愛心包', price: 20, img: 'bag_heart.png' },
    { id: 'rabbit', name: '兔兔包', price: 30, img: 'bag_rabbit.png' },
  ],
  accessoryId: [
    { id: 'catears', name: '貓耳髮箍', price: 15, img: 'acc_catears.png' },
    { id: 'starclips', name: '星星髮夾', price: 25, img: 'acc_starclips.png' },
  ],
  shoesId: [
    { id: 'maryjanes', name: '瑪莉珍鞋', price: 20, img: 'shoes_maryjanes.png' },
    { id: 'rabbitslippers', name: '兔兔拖鞋', price: 30, img: 'shoes_rabbitslippers.png' },
  ],
};

const SHOP_SLOTS = [
  { key: 'topId', label: '衣服' },
  { key: 'skirtId', label: '裙子' },
  { key: 'pantsId', label: '褲子' },
  { key: 'bagId', label: '包包' },
  { key: 'accessoryId', label: '飾品' },
  { key: 'shoesId', label: '鞋子' },
];

function shopItem(slotKey, itemId) {
  const list = SHOP[slotKey];
  if (!list) return null;
  return list.find(i => i.id === itemId) || null;
}
