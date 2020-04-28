function $(element) {
  return document.querySelectorAll(element);
}
let canvas = $("#canvas")[0];
let context = canvas.getContext("2d");
// 网格
let canGrid;
// 方块
let squGrid;
// 方块列表
let mapList = [];
// 图片
let img;
// 场景宽度
let stageWidth = 300;
// 场景高度
let stageHeight = 400;
// 游戏难度
let gameDifficulty = "简单";
// 浏览器属性
let moz = {
  width() { return document.documentElement.clientWidth; },
  height() { return document.documentElement.clientHeight; }
};
// 临时坐标
let coorRecord = null;
// 发现的地雷数
let mineNum_Seek = 0;
// 已标记数
let yetSign = 0;
// 地雷数
let minesNum = 0;
// 过去的时间
let formTime = 0;
// 游戏状态
let gameState = false;
// 需要加载的图像
let imageAddress = ["images/restart.png", "images/bg2.png", "images/defeat.gif", "images/victory.gif"];
// 已加载好的图像
let imageStart = [];
// 当前加载的图像ID
let imageId = 0;
// 尺寸设置
let size = 30;
// 区域获取
let text = $("#text")[0];
let Difficu = $("#Difficu")[0];
let restart = $("#restart")[0];
let hint = $("#hint")[0];
let butt = $("#butt")[0];
(function loadImag() {
  let imageObj = new Image();
  imageObj.src = imageAddress[imageId];
  imageObj.onload = function () {
    imageStart.push(imageObj);
    imageId++;
    if (imageId < imageAddress.length) 
      loadImag();
    else {
      $("#load")[0].style.display = "none";
      Difficu.style.display = "block";
    }
  };
})();
// 设置场景宽度
function setWidth(width, height) {
  stageWidth = width;
  stageHeight = height;
  canvas.width = width;
  canvas.height = height;
  $("#Mclear")[0].style.width = width + "px";
  restart.style.margin = "0 " + (width - 200) / 2 + "px";
}
// 初始化
function initMian() {
  // 网格
  canGrid = null;
  // 方块
  squGrid = null;
  // 方块列表
  mapList.length = 0;
  // 临时坐标
  coorRecord = null;
  // 发现的地雷数
  mineNum_Seek = 0;
  // 已标记数
  yetSign = 0;
  // 地雷数
  minesNum = 0;
  // 过去的时间
  formTime = 0;
  // 游戏状态
  gameState = false;
}
// 难度选择
$("#Difficu span").forEach(span => span.onclick = () => (Diff => {
  hint.className = "animati1";
  initMian();
  gameDifficulty = Diff;
  mapInit();
})(span.innerHTML));
// 初始化地图
function mapInit() {
  img = imageStart[0];
  GenerateMap();
}
// 生成地图
function GenerateMap() {
  let listNum;
  switch (gameDifficulty) {
    case "简单":
      listNum = 10;
      minesNum = 20;
      break;
    case "一般":
      listNum = 20;
      minesNum = 50;
      break;
    case "困难":
      listNum = 30;
      minesNum = 100;
      break;
  }
  let widht = listNum * size;
  let cHeighe = moz.height();
  let height = widht > cHeighe ? cHeighe - 150 : widht;
  height = height - height % size;
  setWidth(widht, height);
  let listNum_y = height / size;
  GenerateGrid(listNum, listNum_y, widht, height);
  GenerateSquare(listNum, listNum_y, minesNum, widht, height);
  addNum(listNum, listNum_y);
  gameState = true;
  signResidue();
  TimeResidue();
}
document.oncontextmenu = function () {
  if (window.navigator.userAgent.toLowerCase().indexOf("ie") == -1)
    return false;
  window.event.returnValue = false;
};
document.onselectstart = function () { return false; };
document.onmousedown = function (e) {
  let sc = getSomeCoord(e);
  if (!sc || !gameState || !mapList[sc.x][sc.y].There)
    return;
  coorRecord = { x: sc.x, y: sc.y };
  restore();
};
document.onmouseup = function (e) {
  if (coorRecord == null)
    return;
  let sc = getSomeCoord(e);
  if (!sc)
    return refreScene();
  let squText = squGrid.getContext("2d");
  let { x, y } = coorRecord;
  switch (e.button) {
    case 0:
      if (sc.x == x && sc.y == y && !mapList[x][y].sign) {
        let num = mapList[x][y].num;
        if (typeof num == "undefined") {
          let data = [y * size, x * size, size, size];
          mapList[x][y].There = false;
          squText.clearRect(...data);
          squText.fillStyle = "#c30700";
          squText.fillRect(...data);
          squText.drawImage(img, 240, 144, size, size, ...data);
          GenerateMine(squText, mapList[x][y]);
        }
        else if (num == 0)
          undefiAdjac(squText);
        else if (num > 0)
          GenerateNum(squText, num);
      }
      break;
    case 2:
      let data = [squText, sc.x, sc.y];
      if (yetSign < minesNum && !mapList[x][y].sign)
        return rightClick(...data);
      else if (mapList[x][y].sign)
        return clearSign(...data);
      break;
  }
  coorRecord = null;
  refreScene();
};
butt.onclick = function () {
  setCss();
};
restart.onclick = function () {
  setCss();
  GameOver();
};
function setCss() {
  text.style.display = "none";
  Difficu.style.display = "block";
}
// 还原状态
function restore() {
  let { x, y } = coorRecord;
  context.drawImage(img, (mapList[x][y].sign ? 3 : 2) * size, 114, size, size, y * size, x * size, size, size);
}
// 绘制地雷
function GenerateMine(squText, mines) {
  mapList.forEach((maps, x) => {
    maps.forEach((map, y) => {
      if (typeof map.num == "undefined" && map != mines) {
        map.There = false;
        let data = [y * size, x * size, size, size];
        squText.clearRect(...data);
        squText.drawImage(img, 240, 144, size, size, ...data);
      }
    });
  });
  return GameOver(0);
}
// 绘制数字
function GenerateNum(squText, num) {
  let { x, y } = coorRecord;
  mapList[x][y].There = false;
  let data = [y * size, x * size, size, size];
  squText.clearRect(...data);
  squText.drawImage(img, (num - 1) * size, 144, size, size, ...data);
}
// 刷新场景
function refreScene() {
  signResidue();
  let data = [0, 0, stageWidth, stageHeight];
  context.clearRect(...data);
  context.drawImage(canGrid, ...data);
  context.drawImage(squGrid, ...data);
}
// 更新标记剩余数
function signResidue() {
  let sign = $("#tabnum span");
  for (let i = 0; i < 3; i++)
    sign[i].style.backgroundPositionX = "0px";
  let num = (minesNum - yetSign).toString();
  for (let i = num.length, z = 2; i > 0; i--, z--)
    sign[z > 2 ? 2 : z].style.backgroundPositionX = -parseInt(num.substring(i - 1, i)) * 20 + "px";
}
// 更新时间
function TimeResidue() {
  if (!gameState)
    return;
  if (formTime++ == 999)
    return GameOver(0);
  let time = $("#time span");
  for (let i = 0; i < 3; i++)
    time[i].style.backgroundPositionX = "0px";
  let num = formTime.toString();
  for (let i = num.length, z = 2; i > 0; i--, z--)
    time[z > 2 ? 2 : z].style.backgroundPositionX = -parseInt(num.substring(i - 1, i)) * 20 + "px";
  setTimeout(TimeResidue, 1000);
}
// 绘制标记
function rightClick(squText, x, y) {
  yetSign++;
  if (typeof mapList[x][y].num == "undefined")
    mineNum_Seek++;
  mapList[x][y].sign = true;
  let data = [y * size, x * size, size, size];
  squText.clearRect(...data);
  squText.drawImage(img, size, 114, size, size, ...data);
  coorRecord = null;
  refreScene();
  if (mineNum_Seek == minesNum)
    GameOver(1);
}
// 清除标记
function clearSign(squText, x, y) {
  yetSign--;
  if (typeof mapList[x][y].num == "undefined")
    mineNum_Seek--;
  mapList[x][y].sign = false;
  let data = [y * size, x * size, size, size];
  squText.clearRect(...data);
  squText.drawImage(img, 0, 114, size, size, ...data);
  coorRecord = null;
  refreScene();
}
// 获取点击位置的横竖坐标
function getSomeCoord(e) {
  let shadow = $("#shadow")[0];
  let x = e.pageY - shadow.offsetTop;
  let y = e.pageX - shadow.offsetLeft;
  if (x < 0 || y < 0 || y > stageWidth || x > stageHeight)
    return false;
  x = parseInt(x / size);
  y = parseInt(y / size);
  return { x, y };
}
// 返回相邻空格
function undefiAdjac(squText) {
  let { x, y } = coorRecord;
  mapList[x][y].There = false;
  squText.clearRect(y * size, x * size, size, size);
  let map = [];
  map.push(coorRecord);
  for (let z = 0; z < map.length; z++) {
    let { x /* 行 */, y /* 列 */ } = map[z];
    for (let i = 0; i < 8; i++) {
      let [line, list] = [
        [x - 1, y + 0],
        [x + 0, y - 1],
        [x + 0, y + 1],
        [x + 1, y + 0],
        [x - 1, y - 1],
        [x - 1, y + 1],
        [x + 1, y - 1],
        [x + 1, y + 1]
      ][i];
      if (line < 0 || list < 0 || list > stageWidth / size - 1 || line > stageHeight / size - 1 || mapList[line][list].There == false)
        continue;
      if (mapList[line][list].num == 0) {
        map.push({ x: line, y: list });
        mapList[line][list].There = false;
        squText.clearRect(list * size, line * size, size, size);
      }
      else if (!isNaN(mapList[line][list].num)) {
        coorRecord = { x: line, y: list };
        GenerateNum(squText, mapList[line][list].num);
      }
    }
  }
}
// 添加数字标记
function addNum(Lx, Ly) {
  let num = 0;
  for (let i = 0; i < Ly; i++) {
    for (let j = 0; j < Lx; j++) {
      if (mapList[i][j].mine)
        continue;
      let { x /* 列 */, y /* 行 */ } = mapList[i][j];
      x /= size;
      y /= size;
      for (let j = 0; j < 8; j++) {
        let [line, list] = [
          [y - 1, x + 0],
          [y + 0, x - 1],
          [y + 0, x + 1],
          [y + 1, x + 0],
          [y - 1, x - 1],
          [y - 1, x + 1],
          [y + 1, x - 1],
          [y + 1, x + 1]
        ][j];
        if (line < 0 || list < 0 || line > Ly - 1 || list > Lx - 1)
          continue;
        if (mapList[line][list].mine)
          num++;
      }
      mapList[i][j].num = num;
      num = 0;
    }
  }
}
// 获取指定范围的随机数
function randomNum(min, max, num) {
  let ranNum = [];
  for (let i = 0; i < num; i++) {
    let Num = min + Math.round(Math.random() * (max - min));
    if (repeat(ranNum, Num)) {
      i--;
      continue;
    }
    ranNum.push(Num);
  }
  return sorting(ranNum);
}
// 判断是否有重复
function repeat(ranNum, Num) {
  for (let i = 0; i < ranNum.length; i++)
    if (ranNum[i] == Num)
      return true;
}
// 排序
function sorting(array) {
  let bool = false;
  for (let i = 0; i < array.length; i++) {
    if (array[i] > array[i + 1]) {
      bool = true;
      [array[i], array[i + 1]] = [array[i + 1], array[i]];
    }
  }
  return bool ? sorting(array) : array;
}
// 添加canvas
function addCanvas(widht, height) {
  let can = document.createElement("canvas");
  can.width = widht;
  can.height = height;
  return can;
}
// 绘制方块
function GenerateSquare(listNum, listNum_y, minesNum, widht, height) {
  squGrid = addCanvas(widht, height);
  let squText = squGrid.getContext("2d");
  let mpl = randomNum(0, listNum * listNum_y, minesNum);
  for (let i = 0; i < listNum_y; i++) {
    mapList[i] = [];
    for (let j = 0; j < listNum; j++) {
      let x = j * size;
      let y = i * size;
      let mine = false;
      if (mpl[0] == i * listNum + j) {
        mine = true;
        mpl.splice(0, 1);
      }
      let square = { x, y, mine, There: true, sign: false };
      mapList[i][j] = square;
      squText.drawImage(img, 0, 114, size, size, x, y, size, size);
    }
  }
  context.drawImage(squGrid, 0, 0);
}
// 绘制网格
function GenerateGrid(listNum, listNum_y, widht, height) {
  canGrid = addCanvas(widht, height);
  let GridText = canGrid.getContext("2d");
  for (let i = 1; i < listNum; i++) {
    let x = i * size;
    setText({ x, y: 0 }, { x, y: height }, "#bcbbbb");
  }
  for (let i = 1; i < listNum_y; i++) {
    let y = i * size;
    setText({ x: 0, y }, { x: widht, y });
  }
  function setText(moveTo, lineTo, color) {
    GridText.beginPath();
    GridText.lineWidth = .1;
    color && (GridText.fillStyle = color);
    GridText.moveTo(moveTo.x, moveTo.y);
    GridText.lineTo(lineTo.x, lineTo.y);
    GridText.stroke();
  }
  context.drawImage(canGrid, 0, 0);
}
// 游戏结束
function GameOver(num) {
  gameState = false;
  switch (num) {
    case 0:
      setPopup({ src: imageAddress[2], html: "呀！踩到炸弹啦！<br>啊~~~" }, "再来一次！");
      break;
    case 1:
      setPopup({ src: imageAddress[3], html: `太厉害了！<br>居然只用了${formTime}秒` }, "挑战更高难度！");
      break;
  }
  function setPopup({ src, html }, HTML) {
    text.style.display = "block";
    Difficu.style.display = "none";
    $("#text img")[0].src = src;
    $("#text p")[0].innerHTML = html;
    butt.innerHTML = HTML;
  }
  hint.className = "animati2";
}
