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

  var transform_emotes = document.querySelector("#transoform_emotes")
  transform_emotes.addEventListener('change', function () {
    if (this.checked) {
      do_transform_emotes = true
    } else {
      do_transform_emotes = false
    }
  })

  var truncate_emotes = document.querySelector('#truncate_emotes')
  truncate_emotes.addEventListener('change', function () {
    if (this.checked) {
      do_transform_emotes = true
    } else {
      do_truncate_emotes = false
    }
  })

  var use_noto_emoji = document.querySelector('#use_noto_emoji')
  use_noto_emoji.addEventListener('change', function () {
    if (this.checked) {
      do_use_noto_emoji = true
    } else {
      do_use_noto_emoji = false
    }
  })

  let getOS = function () {
    const userAgent = window.navigator.userAgent,
      platform = window.navigator?.userAgentData?.platform || window.navigator.platform,
      macosPlatforms = ['macOS', 'Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
      windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
      iosPlatforms = ['iPhone', 'iPad', 'iPod'];
    let os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (/Linux/.test(platform)) {
      os = 'Linux';
    }

    return os;
  }

  let os = getOS()

  if (os !== 'Windows') {
    // check the input box use_noto_emoji
    use_noto_emoji.checked = true
    do_use_noto_emoji = true
  }
});


if (navigator.userAgent.match(/^Mozilla\/5.0 \([^)]+; rv:[\d.]+\) Gecko\/[\d]{8} Firefox\/[\d.]+$/)) {
  const style = document.createElement('style');
  style.innerHTML = '.addon { display: block; }';
  document.documentElement.appendChild(style);
}