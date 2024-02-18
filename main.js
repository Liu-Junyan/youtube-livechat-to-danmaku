﻿// ==UserScript==
// @name        bilibili ASS Danmaku Downloader
// @namespace   https://github.com/tiansh
// @description 以 ASS 格式下载 bilibili 的弹幕
// @include     http://www.bilibili.com/video/av*
// @include     http://bangumi.bilibili.com/movie/*
// @updateURL   https://tiansh.github.io/us-danmaku/bilibili/bilibili_ASS_Danmaku_Downloader.meta.js
// @downloadURL https://tiansh.github.io/us-danmaku/bilibili/bilibili_ASS_Danmaku_Downloader.user.js
// @version     1.11
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// @run-at      document-start
// @author      田生
// @copyright   2014+, 田生
// @license     Mozilla Public License 2.0; http://www.mozilla.org/MPL/2.0/
// @license     CC Attribution-ShareAlike 4.0 International; http://creativecommons.org/licenses/by-sa/4.0/
// @connect-src comment.bilibili.com
// @connect-src interface.bilibili.com
// ==/UserScript==

/*
 * Common
 */

// 设置项
var config = {
  'playResX': 560,           // 屏幕分辨率宽（像素）
  'playResY': 420,           // 屏幕分辨率高（像素）
  'fontlist': [              // 字形（会自动选择最前面一个可用的）
    'PingFang SC',
    'Microsoft YaHei UI',
    'Microsoft YaHei',
    '文泉驿正黑',
    'STHeitiSC',
    '黑体',
  ],
  'font_size': 1.0,          // 字号（比例）
  'r2ltime': 8,              // 右到左弹幕持续时间（秒）
  'fixtime': 4,              // 固定弹幕持续时间（秒）
  'opacity': 0.7,            // 不透明度（比例）
  'space': 0,                // 弹幕间隔的最小水平距离（像素）
  'max_delay': 6,            // 最多允许延迟几秒出现弹幕
  'bottom': 50,              // 底端给字幕保留的空间（像素）
  'use_canvas': null,        // 是否使用canvas计算文本宽度（布尔值，Linux下的火狐默认否，其他默认是，Firefox bug #561361）
  'debug': false,            // 打印调试信息
};

var debug = config.debug ? console.log.bind(console) : function () { };

// 将字典中的值填入字符串
var fillStr = function (str) {
  var dict = Array.apply(Array, arguments);
  return str.replace(/{{([^}]+)}}/g, function (r, o) {
    var ret;
    dict.some(function (i) { return ret = i[o]; });
    return ret || '';
  });
};

// 将颜色的数值化为十六进制字符串表示
var RRGGBB = function (color) {
  var t = Number(color).toString(16).toUpperCase();
  return (Array(7).join('0') + t).slice(-6);
};

// 将可见度转换为透明度
var hexAlpha = function (opacity) {
  var alpha = Math.round(0xFF * (1 - opacity)).toString(16).toUpperCase();
  return Array(3 - alpha.length).join('0') + alpha;
};

// 字符串
var funStr = function (fun) {
  return fun.toString().split(/\r\n|\n|\r/).slice(1, -1).join('\n');
};

// 平方和开根
var hypot = Math.hypot ? Math.hypot.bind(Math) : function () {
  return Math.sqrt([0].concat(Array.apply(Array, arguments))
    .reduce(function (x, y) { return x + y * y; }));
};

// 创建下载
var startDownload = function (data, filename) {
  var blob = new Blob([data], { type: 'application/octet-stream' });
  var url = window.URL.createObjectURL(blob);
  var saveas = document.createElement('a');
  saveas.href = url;
  saveas.style.display = 'none';
  document.body.appendChild(saveas);
  saveas.download = filename;
  saveas.click();
  setTimeout(function () { saveas.parentNode.removeChild(saveas); }, 1000)
  document.addEventListener('unload', function () { window.URL.revokeObjectURL(url); });
};

function c(fontname, text, fontsize) {
  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  context.font = 'bold ' + fontsize + 'px ' + fontname;
  return Math.ceil(context.measureText(text).width + config.space);
}

// 计算文字宽度
var calcWidth = (function () {

  // 使用Canvas计算
  var calcWidthCanvas = function () {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    return function (fontname, text, fontsize) {
      context.font = 'bold ' + fontsize + 'px ' + fontname;
      return Math.ceil(context.measureText(text).width + config.space);
    };
  }

  // 使用Div计算
  var calcWidthDiv = function () {
    var d = document.createElement('div');
    d.setAttribute('style', [
      'all: unset', 'top: -10000px', 'left: -10000px',
      'width: auto', 'height: auto', 'position: absolute',
    '',].join(' !important; '));
    var ld = function () { document.body.parentNode.appendChild(d); }
    if (!document.body) document.addEventListener('DOMContentLoaded', ld);
    else ld();
    return function (fontname, text, fontsize) {
      d.textContent = text;
      d.style.font = 'bold ' + fontsize + 'px ' + fontname;
      return d.clientWidth + config.space;
    };
  };

  // 检查使用哪个测量文字宽度的方法
  if (config.use_canvas === null) {
    if (navigator.platform.match(/linux/i) &&
    !navigator.userAgent.match(/chrome/i)) config.use_canvas = false;
  }
  debug('use canvas: %o', config.use_canvas !== false);
  if (config.use_canvas === false) return calcWidthDiv();
  return calcWidthCanvas();

}());

// 选择合适的字体
var choseFont = function (fontlist) {
  // 检查这个字串的宽度来检查字体是否存在
  var sampleText =
    'The quick brown fox jumps over the lazy dog' +
    '7531902468' + ',.!-' + '，。：！' +
    '天地玄黄' + '則近道矣';
  // 和这些字体进行比较
  var sampleFont = [
    'monospace', 'sans-serif', 'sans',
    'Symbol', 'Arial', 'Comic Sans MS', 'Fixed', 'Terminal',
    'Times', 'Times New Roman',
    '宋体', '黑体', '文泉驿正黑', 'Microsoft YaHei'
  ];
  // 如果被检查的字体和基准字体可以渲染出不同的宽度
  // 那么说明被检查的字体总是存在的
  var diffFont = function (base, test) {
    var baseSize = calcWidth(base, sampleText, 72);
    var testSize = calcWidth(test + ',' + base, sampleText, 72);
    return baseSize !== testSize;
  };
  var validFont = function (test) {
    var valid = sampleFont.some(function (base) {
      return diffFont(base, test);
    });
    debug('font %s: %o', test, valid);
    return valid;
  };
  // 找一个能用的字体
  var f = fontlist[fontlist.length - 1];
  fontlist = fontlist.filter(validFont);
  debug('fontlist: %o', fontlist);
  return fontlist[0] || f;
};

// 从备选的字体中选择一个机器上提供了的字体
var initFont = (function () {
  var done = false;
  return function () {
    if (done) return; done = true;
    calcWidth = calcWidth.bind(window,
      config.font = choseFont(config.fontlist)
    );
  };
}());

var generateASS = function (danmaku, info) {
  var assHeader = fillStr(funStr(function () {/*! ASS弹幕文件文件头
[Script Info]
Title: {{title}}
Original Script: 根据 {{ori}} 的弹幕信息，由 https://github.com/tiansh/us-danmaku 生成
ScriptType: v4.00+
Collisions: Normal
PlayResX: {{playResX}}
PlayResY: {{playResY}}
Timer: 10.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Fix,{{font}},25,&H{{alpha}}FFFFFF,&H{{alpha}}FFFFFF,&H{{alpha}}000000,&H{{alpha}}000000,1,0,0,0,100,100,0,0,1,2,0,2,20,20,2,0
Style: R2L,{{font}},25,&H{{alpha}}FFFFFF,&H{{alpha}}FFFFFF,&H{{alpha}}000000,&H{{alpha}}000000,1,0,0,0,100,100,0,0,1,2,0,2,20,20,2,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text

  */}), config, info, {'alpha': hexAlpha(config.opacity) });
  // 补齐数字开头的0
  var paddingNum = function (num, len) {
    num = '' + num;
    while (num.length < len) num = '0' + num;
    return num;
  };
  // 格式化时间
  var formatTime = function (time) {
    time = 100 * time ^ 0;
    var l = [[100, 2], [60, 2], [60, 2], [Infinity, 0]].map(function (c) {
      var r = time % c[0];
      time = (time - r) / c[0];
      return paddingNum(r, c[1]);
    }).reverse();
    return l.slice(0, -1).join(':') + '.' + l[3];
  };
  // 格式化特效
  var format = (function () {
    // 适用于所有弹幕
    var common = function (line) {
      var s = '';
      var rgb = line.color.split(/(..)/).filter(function (x) { return x; })
        .map(function (x) { return parseInt(x, 16); });
      // 如果不是白色，要指定弹幕特殊的颜色
      if (line.color !== 'FFFFFF') // line.color 是 RRGGBB 格式
        s += '\\c&H' + line.color.split(/(..)/).reverse().join('');
      // 如果弹幕颜色比较深，用白色的外边框
      var dark = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 < 0x30;
      if (dark) s += '\\3c&HFFFFFF';
      if (line.size !== 25) s += '\\fs' + line.size;
      return s;
    };
    // 适用于从右到左弹幕
    var r2l = function (line) {
      return '\\move(' + [
        line.poss.x, line.poss.y, line.posd.x, line.posd.y
      ].join(',') + ')';
    };
    // 适用于固定位置弹幕
    var fix = function (line) {
      return '\\pos(' + [
        line.poss.x, line.poss.y
      ].join(',') + ')';
    };
    var withCommon = function (f) {
      return function (line) { return f(line) + common(line); };
    };
    return {
      'R2L': withCommon(r2l),
      'Fix': withCommon(fix),
    };
  }());
  // 转义一些字符
  var escapeAssText = function (s) {
    // "{"、"}"字符libass可以转义，但是VSFilter不可以，所以直接用全角补上
    return s.replace(/{/g, '｛').replace(/}/g, '｝').replace(/\r|\n/g, '');
  };
  // 将一行转换为ASS的事件
  var convert2Ass = function (line) {
    return 'Dialogue: ' + [
      0,
      formatTime(line.stime),
      formatTime(line.dtime),
      line.type,
      ',20,20,2,,',
    ].join(',')
      + '{' + format[line.type](line) + '}'
      + escapeAssText(line.text);
  };
  return assHeader +
    danmaku.map(convert2Ass)
    .filter(function (x) { return x; })
    .join('\n');
};

/*

下文字母含义：
0       ||----------------------x---------------------->
           _____________________c_____________________
=        /                     wc                      \      0
|       |                   |--v--|                 wv  |  |--v--|
|    d  |--v--|               d f                 |--v--|
y |--v--|  l                                         f  |  s    _ p
|       |              VIDEO           |--v--|          |--v--| _ m
v       |              AREA            (x ^ y)          |

v: 弹幕
c: 屏幕

0: 弹幕发送
a: 可行方案

s: 开始出现
f: 出现完全
l: 开始消失
d: 消失完全

p: 上边缘（含）
m: 下边缘（不含）

w: 宽度
h: 高度
b: 底端保留

t: 时间点
u: 时间段
r: 延迟

并规定
ts := t0s + r
tf := wv / (wc + ws) * p + ts
tl := ws / (wc + ws) * p + ts
td := p + ts

*/

// 滚动弹幕
var normalDanmaku = (function (wc, hc, b, u, maxr) {
  return function () {
    // 初始化屏幕外面是不可用的
    var used = [
      { 'p': -Infinity, 'm': 0, 'tf': Infinity, 'td': Infinity, 'b': false },
      { 'p': hc, 'm': Infinity, 'tf': Infinity, 'td': Infinity, 'b': false },
      { 'p': hc - b, 'm': hc, 'tf': Infinity, 'td': Infinity, 'b': true },
    ];
    // 检查一些可用的位置
    var available = function (hv, t0s, t0l, b) {
      var suggestion = [];
      // 这些上边缘总之别的块的下边缘
      used.forEach(function (i) {
        if (i.m > hc) return;
        var p = i.m;
        var m = p + hv;
        var tas = t0s;
        var tal = t0l;
        // 这些块的左边缘总是这个区域里面最大的边缘
        used.forEach(function (j) {
          if (j.p >= m) return;
          if (j.m <= p) return;
          if (j.b && b) return;
          tas = Math.max(tas, j.tf);
          tal = Math.max(tal, j.td);
        });
        // 最后作为一种备选留下来
        suggestion.push({
          'p': p,
          'r': Math.max(tas - t0s, tal - t0l),
        });
      });
      // 根据高度排序
      suggestion.sort(function (x, y) { return x.p - y.p; });
      var mr = maxr;
      // 又靠右又靠下的选择可以忽略，剩下的返回
      suggestion = suggestion.filter(function (i) {
        if (i.r >= mr) return false;
        mr = i.r;
        return true;
      });
      return suggestion;
    };
    // 添加一个被使用的
    var use = function (p, m, tf, td) {
      used.push({ 'p': p, 'm': m, 'tf': tf, 'td': td, 'b': false });
    };
    // 根据时间同步掉无用的
    var syn = function (t0s, t0l) {
      used = used.filter(function (i) { return i.tf > t0s || i.td > t0l; });
    };
    // 给所有可能的位置打分，分数是[0, 1)的
    var score = function (i) {
      if (i.r > maxr) return -Infinity;
      return 1 - hypot(i.r / maxr, i.p / hc) * Math.SQRT1_2;
    };
    // 添加一条
    return function (t0s, wv, hv, b) {
      var t0l = wc / (wv + wc) * u + t0s;
      syn(t0s, t0l);
      var al = available(hv, t0s, t0l, b);
      if (!al.length) return null;
      var scored = al.map(function (i) { return [score(i), i]; });
      var best = scored.reduce(function (x, y) {
        return x[0] > y[0] ? x : y;
      })[1];
      var ts = t0s + best.r;
      var tf = wv / (wv + wc) * u + ts;
      var td = u + ts;
      use(best.p, best.p + hv, tf, td);
      return {
        'top': best.p,
        'time': ts,
      };
    };
  };
}(config.playResX, config.playResY, config.bottom, config.r2ltime, config.max_delay));

// 为每条弹幕安置位置
var setPosition = function (danmaku) {
  var normal = normalDanmaku();
  // console.log(danmaku[0])
  return danmaku
    .sort(function (x, y) { return x.time - y.time; })
    .map(function (line) {
      var font_size = Math.round(line.size * config.font_size);
      var width = calcWidth(line.text, font_size);
      switch (line.mode) {
        case 'R2L': return (function () {
          var pos = normal(line.time, width, font_size, line.bottom);
          if (!pos) return null;
          line.type = 'R2L';
          line.stime = pos.time;
          line.poss = {
            'x': config.playResX + width / 2,
            'y': pos.top + font_size,
          };
          line.posd = {
            'x': -width / 2,
            'y': pos.top + font_size,
          };
          line.dtime = config.r2ltime + line.stime;
          return line;
        }());
        default: return null;
      };
    })
    .filter(function (l) { return l; })
    .sort(function (x, y) { return x.stime - y.stime; });
};

var parseJSON = function(content) {
  var data = JSON.parse(content)
  data = data.filter(
    function(el) {
      return el.time_in_seconds >= 0 && el.message_type ==='text_message'
    }
  )
  let new_data = []
  for (let index = 0; index < data.length; index++) {
    let el = data[index]
    // el.new_message = el.message.replace(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}\u{200d}]*/ug, '')
    el.new_message = el.new_message.replace(/^\s+$/, '')
    el.new_message = el.new_message.replace(/:_(.*?):/g, "[$1]")
    if (c("PingFang SC", el.new_message, 25) > 0) {
      new_data.push(el)
    }
  }
  return new_data.map(function(el) {
    return {
      'text': el.new_message,
      'time': el.time_in_seconds,
      'mode': 'R2L',
      'size': 25,
      'color': "FFFFFF",
      'bottom': false
    }
  })
}



 // 初始化
var init = function () {
  initFont();
};

if (document.body) init();
else window.addEventListener('DOMContentLoaded', init);
