var gotFile = function (name, content) {
  var danmaku = parseFile(content);
  // console.log(danmaku)
  var ass = generateASS(setPosition(danmaku), {
    'title': document.title,
    'ori': name,
  });
  startDownload('\ufeff' + ass, name.replace(/\.[^.]*$/, '') + '.ass');
};

var parseFile = function (content) {
  return parseJSON(content)
}

window.addEventListener('load', function () {
  var upload = document.querySelector('#upload');
  upload.addEventListener('change', function () {
    var file = upload.files[0];
    var name = file.name;
    var reader = new FileReader();
    reader.addEventListener('load', function () {
      gotFile(name, reader.result);
    });
    reader.readAsText(file);
    upload.value = '';
  });
});


if (navigator.userAgent.match(/^Mozilla\/5.0 \([^)]+; rv:[\d.]+\) Gecko\/[\d]{8} Firefox\/[\d.]+$/)) {
  const style = document.createElement('style');
  style.innerHTML = '.addon { display: block; }';
  document.documentElement.appendChild(style);
}
