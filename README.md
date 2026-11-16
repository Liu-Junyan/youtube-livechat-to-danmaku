# youtube-livechat-to-danmaku

A tool to convert YouTube live chat to danmaku in ASS format.

## Online Demo

[YouTube ASS 弹幕在线转换](https://liu-junyan.github.io/youtube-livechat-to-danmaku/)

## Usage

### 1. Install the chat downloader

Use [Indigo128/chat-downloader](https://github.com/Indigo128/chat-downloader), a fork of the original downloader with YouTube authentication fixes. Chat JSON downloaded with this fork has been tested with this converter.

With Python, pip, and Git installed, run this in your Python environment:

```sh
python -m pip install --upgrade --force-reinstall "git+https://github.com/Indigo128/chat-downloader.git"
```

This also replaces an existing installation in that environment. Installing `chat-downloader` from PyPI alone installs the original package, not this fork. The command name remains `chat_downloader`.

### 2. Download chat as JSON

Choose an ended YouTube livestream with chat replay available. Replace `VIDEO_ID` with the video's ID and run:

```sh
chat_downloader "https://www.youtube.com/watch?v=VIDEO_ID" --output chat.json
```

Wait for the download to finish. `chat.json` is saved in your terminal's current directory. Keep the `.json` extension; the converter expects the downloader's JSON array, not CSV or terminal output.

If YouTube requires authentication, export your signed-in YouTube cookies in Netscape cookies.txt format and pass the file to the downloader:

```sh
chat_downloader "https://www.youtube.com/watch?v=VIDEO_ID" --cookies cookies.txt --output chat.json
```

Keep cookies private; only select the chat JSON in the converter. If downloading fails, confirm that chat replay is available and that you installed the fork in the environment providing `chat_downloader`.

For a small test, append `--start_time 0 --end_time 300 --max_messages 500` to download up to 500 messages from the first five minutes. Timestamps remain relative to the original video.

### 3. Convert to ASS

Open the [online converter](https://liu-junyan.github.io/youtube-livechat-to-danmaku/) or the local `index.html` in a browser. Choose the emote options **before** clicking **上传JSON文件** (Upload JSON), then select `chat.json`. Conversion runs in your browser and downloads `chat.ass` automatically.

Load the ASS file as a subtitle track in a player that supports ASS, alongside the matching video. On non-Windows systems, the page enables Noto Emoji by default; install that font if you use this option.

Only text messages at or after the start of the video are converted. Empty messages after emote removal and messages that cannot fit the danmaku layout are omitted, so the ASS event count can be lower than the chat message count.

## Credit

The core logic of this project to construct ASS file is based on [tiansh/us-danmaku](https://github.com/tiansh/us-danmaku).
