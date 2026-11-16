(function () {
  'use strict';

  var storageKey = 'youtube-danmaku-language';
  var translations = {
  "en": {
    "title": "YouTube ASS Danmaku Converter",
    "intro": "Convert YouTube live chat to ASS danmaku<br />Compatible with libass and VSFilter",
    "upload": "Upload JSON",
    "uploadTitle": "Upload a downloaded JSON file to convert it in your browser",
    "options": "Options",
    "help": "Help",
    "about": "About",
    "transform": "Convert emotes",
    "truncate": "Remove unknown emotes",
    "noto": "Use Noto Emoji",
    "transformHelp": "YouTube live chat has three types of emotes: channel-specific emotes, YouTube emotes, and standard emoji. The first two cannot be rendered locally. Even standard emoji may appear as :custom_name:. Enable this option to convert standard emoji to Unicode for local rendering.",
    "truncateHelp": "Remove all remaining emotes in the :custom_name: format.",
    "notoHelp": "Noto Emoji is a monochrome emoji font. Non-Windows platforms typically use libass to render ASS subtitles, which does not render color emoji. To display emoji on these platforms, enable this option and <a href=\"https://fonts.google.com/noto/specimen/Noto+Emoji\" target=\"_blank\">install the font</a> locally.",
    "downloadHelp": "Download chat with the <a href=\"https://github.com/Indigo128/chat-downloader\">Indigo128/chat-downloader fork</a>. Choose an ended livestream with chat replay available and replace <code>VIDEO_ID</code> with the video ID:",
    "convertHelp": "Set the options above, then click “Upload JSON” and select <code>chat.json</code>. The ASS danmaku file will download automatically; load it in your video player.",
    "readmeHelp": "See the <a href=\"https://github.com/Liu-Junyan/youtube-livechat-to-danmaku/blob/main/README.md\">README</a> for installation and authentication instructions.",
    "credit": "This project is based on <a href=\"https://github.com/tiansh/us-danmaku\">tiansh/us-danmaku</a>.",
    "description": "Convert YouTube live chat to downloadable ASS danmaku subtitles in your browser."
  },
  "zh": {
    "title": "YouTube ASS 弹幕在线转换",
    "intro": "\n        将YouTube Live Chat转换为ASS弹幕<br />\n        兼容 libass 和 VSFilter 的 ASS 格式解析器<br />\n      ",
    "upload": "上传JSON文件",
    "uploadTitle": "上传下载好的 JSON 文件在线转换",
    "options": "选项",
    "help": "帮助",
    "about": "关于",
    "transform": "转换Emotes",
    "truncate": "移除未知Emotes",
    "noto": "使用Noto Emoji",
    "transformHelp": "YouTube live chat有三种emotes：频道专属、YouTube原创、标准Emoji；前两种无法在本地渲染。即使是第三种，YouTube也以 :custom_name: 的形式表示。勾选此项将把它们转换为Unicode，以在本地渲染。\n      ",
    "truncateHelp": "勾选此项将移除所有 :custom_name: 形式的emotes。",
    "notoHelp": "Noto Emoji：一种黑白Emoji字体。非Windows平台一般用libass渲染ASS字幕，该库无法渲染彩色Emoji。因此，如需在非Windows平台渲染Emoji需勾选此项并在本地<a href=\"https://fonts.google.com/noto/specimen/Noto+Emoji\" target=\"_blank\">安装字体</a>。",
    "downloadHelp": "使用 <a href=\"https://github.com/Indigo128/chat-downloader\">Indigo128/chat-downloader 分支</a>下载聊天记录。请选择有聊天重放的已结束直播，将 <code>VIDEO_ID</code> 替换为视频 ID：",
    "convertHelp": "先设置上方选项，再点击“上传JSON文件”选择 <code>chat.json</code>，即可下载 ASS 弹幕文件并在播放器中加载。",
    "readmeHelp": "安装方法及登录验证说明见 <a href=\"https://github.com/Liu-Junyan/youtube-livechat-to-danmaku/blob/main/README.md\">README</a>。",
    "credit": "本项目基于<a href=\"https://github.com/tiansh/us-danmaku\">tiansh/us-danmaku</a>。",
    "description": "YouTube ASS Danmaku Downloader，以 ASS 格式下载 YouTube 的弹幕"
  }
};
  var languageButtons = document.querySelectorAll('[data-language]');

  function applyLanguage(language) {
    var messages = translations[language];
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (element) {
      // Only trusted, bundled translations contain markup; no user input is inserted.
      element.innerHTML = messages[element.getAttribute('data-i18n')];
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (element) {
      element.title = messages[element.getAttribute('data-i18n-title')];
    });
    document.querySelectorAll('[data-i18n-content]').forEach(function (element) {
      element.content = messages[element.getAttribute('data-i18n-content')];
    });
    languageButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-language') === language));
    });
  }

  var preferredLanguage = navigator.languages && navigator.languages[0] || navigator.language || '';
  var language = /^zh(?:-|$)/i.test(preferredLanguage) ? 'zh' : 'en';
  try {
    var savedLanguage = localStorage.getItem(storageKey);
    if (savedLanguage === 'zh' || savedLanguage === 'en') language = savedLanguage;
  } catch (error) {
    // Storage may be unavailable, for example when browser privacy settings block it.
  }
  applyLanguage(language);

  languageButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var language = button.getAttribute('data-language');
      applyLanguage(language);
      try {
        localStorage.setItem(storageKey, language);
      } catch (error) {
        // The switch still works for this page when the preference cannot be saved.
      }
    });
  });
}());
