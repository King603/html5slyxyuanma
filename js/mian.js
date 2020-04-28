var imageAddress = ['images/restart.png'];//需要加载的图像
var imageStart = [];//已加载好的图像
var imageId = 0;//当前加载的图像ID
(function loadImag() {
  var imageObj = new Image();
  imageObj.src = imageAddress[imageId];
  imageObj.onload = function () {
    imageStart.push(imageObj);
    imageId++;
    if (imageId < imageAddress.length) {
      loadImag();
    }
  }
})()