# Video previews

The five original MP4 files are preserved. Their `*-480p.mp4` counterparts are the default streaming versions: 854×480 H.264, AAC 64 kb/s, maximum 30 fps, a keyframe every two seconds, and MP4 metadata before media data (`faststart`). The lower-bitrate first two sources use video caps of 280 and 380 kb/s; the others use 480 kb/s. CRF 27 can encode below these caps when the scene permits.

Regenerate with Python 3 and an ffmpeg build containing `libx264` and `aac`:

```powershell
python tools/prepare-video-previews.py --ffmpeg "C:\path\to\ffmpeg.exe" --force
```

If `ffmpeg` is on PATH, or `imageio-ffmpeg` is installed, `--ffmpeg` is optional. Add `--verify-only` to inspect existing previews and fully decode every audio/video stream. Add `--only video-01-720p-revised.mp4` with `--force` to regenerate a single film while still checking and mapping all five.

The script writes `dist/video-manifest.js` for the synchronous `window.VIDEO_PREVIEWS` source mapping, `dist/assets/videos/preview-manifest.json` for metrics, and the matching `tools/video-preview-manifest.json`. Verification checks source/preview durations, track durations, audio presence/sample rate/channels, codecs, dimensions, frame rate, smaller output size, MP4 box order, and complete decoding. Each preview is written to a temporary file before replacing its previous preview; the original files are never replaced.
