#!/usr/bin/env python3
"""Create small, seekable video previews without replacing the originals.

Run: python tools/prepare-video-previews.py --ffmpeg /path/to/ffmpeg
Uses ffmpeg (H.264/AAC); verification and MP4 inspection use Python stdlib.
"""

import argparse
import json
import math
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import time


ROOT = Path(__file__).resolve().parents[1]
VIDEO_DIR = ROOT / "dist" / "assets" / "videos"
SOURCES = (
    "video-01-720p-revised.mp4",
    "video-02-720p.mp4",
    "video-03-720p.mp4",
    "video-04-720p.mp4",
    "yuedong-qingjiang.mp4",
)
# The first two originals already have lower bitrates than the other films.
# Their caps scale down accordingly, so previews never grow the source files.
VIDEO_RATE_CAPS = {SOURCES[0]: 280, SOURCES[1]: 380}


def run(command):
    return subprocess.run(command, capture_output=True, text=True, check=True)


def inspect_ffmpeg(exe, path):
    # ffmpeg prints stream metadata and exits 1 when only an input is supplied.
    result = subprocess.run(
        [exe, "-hide_banner", "-i", str(path)], capture_output=True, text=True
    )
    output = result.stderr
    duration = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", output)
    video = next((line for line in output.splitlines() if "Video:" in line), "")
    audio = next((line for line in output.splitlines() if "Audio:" in line), "")
    size = re.search(r"\b(\d{2,})x(\d{2,})\b", video)
    fps = re.search(r"([\d.]+) fps", video)
    if not duration or not size or not fps:
        raise RuntimeError(f"Cannot inspect {path}: {output}")
    seconds = int(duration[1]) * 3600 + int(duration[2]) * 60 + float(duration[3])
    return {
        "durationSeconds": seconds,
        "width": int(size[1]),
        "height": int(size[2]),
        "fps": float(fps[1]),
        "videoCodec": "h264" if "Video: h264" in video else video,
        "audioCodec": "aac" if "Audio: aac" in audio else audio,
        "hasAudio": bool(audio),
        "audioSampleRate": int(re.search(r"(\d+) Hz", audio)[1]) if audio else None,
        "audioChannels": "stereo" if "stereo" in audio else "mono" if "mono" in audio else None,
    }


def boxes(file, start, end):
    position = start
    while position + 8 <= end:
        file.seek(position)
        size, kind = struct.unpack(">I4s", file.read(8))
        header = 8
        if size == 1:
            size = struct.unpack(">Q", file.read(8))[0]
            header = 16
        elif size == 0:
            size = end - position
        if size < header or position + size > end:
            raise ValueError(f"Invalid MP4 box at {position}")
        yield kind.decode("ascii"), position, position + header, position + size
        position += size


def inspect_mp4(path):
    with path.open("rb") as file:
        top = list(boxes(file, 0, path.stat().st_size))
        positions = {kind: start for kind, start, _, _ in top}
        moov = next(box for box in top if box[0] == "moov")
        tracks = []
        for kind, _, payload, end in boxes(file, moov[2], moov[3]):
            if kind != "trak":
                continue
            mdia = next(box for box in boxes(file, payload, end) if box[0] == "mdia")
            children = list(boxes(file, mdia[2], mdia[3]))
            header = next(box for box in children if box[0] == "mdhd")
            file.seek(header[2])
            data = file.read(header[3] - header[2])
            if data[0] == 1:
                timescale, duration = struct.unpack(">IQ", data[20:32])
            else:
                timescale, duration = struct.unpack(">II", data[12:20])
            handler = next(box for box in children if box[0] == "hdlr")
            file.seek(handler[2] + 8)
            track_type = file.read(4).decode("ascii")
            tracks.append({"type": track_type, "durationSeconds": duration / timescale})
        return {
            "moovBeforeMdat": positions["moov"] < positions["mdat"],
            "moovOffset": positions["moov"],
            "mdatOffset": positions["mdat"],
            "tracks": tracks,
        }


def verify(exe, source, preview, original):
    if preview.stat().st_size >= source.stat().st_size:
        raise RuntimeError(f"Preview must be smaller than its original: {preview}")
    stream = inspect_ffmpeg(exe, preview)
    original_mp4 = inspect_mp4(source)
    mp4 = inspect_mp4(preview)
    if stream["videoCodec"] != "h264" or stream["audioCodec"] != "aac":
        raise RuntimeError(f"Unexpected codecs in {preview}")
    if (stream["width"], stream["height"]) != (854, 480):
        raise RuntimeError(f"Unexpected preview dimensions in {preview}")
    if stream["fps"] > 30 or not mp4["moovBeforeMdat"]:
        raise RuntimeError(f"Invalid streaming layout in {preview}")
    if stream["hasAudio"] != original["hasAudio"]:
        raise RuntimeError(f"Missing audio in {preview}")
    if stream["audioSampleRate"] != original["audioSampleRate"] or stream["audioChannels"] != original["audioChannels"]:
        raise RuntimeError(f"Audio format changed in {preview}")
    if abs(stream["durationSeconds"] - original["durationSeconds"]) > 0.06:
        raise RuntimeError(f"Container duration changed in {preview}")
    original_tracks = {track["type"]: track["durationSeconds"] for track in original_mp4["tracks"]}
    track_deltas = {}
    for track in mp4["tracks"]:
        delta = track["durationSeconds"] - original_tracks[track["type"]]
        track_deltas[track["type"]] = round(delta, 6)
        if abs(delta) > 0.06:
            raise RuntimeError(f"Track duration changed in {preview}: {track['type']} {delta}")
    # Fully decode every frame and all audio; any corrupt packet fails the job.
    run([exe, "-hide_banner", "-loglevel", "error", "-xerror", "-i", str(preview), "-map", "0:v:0", "-map", "0:a:0", "-f", "null", os.devnull])
    return {**stream, **mp4, "trackDurationDeltasSeconds": track_deltas, "decodeVerified": True}


def find_ffmpeg(explicit):
    candidates = [explicit, os.environ.get("FFMPEG_BINARY"), shutil.which("ffmpeg")]
    try:
        import imageio_ffmpeg
        candidates.append(imageio_ffmpeg.get_ffmpeg_exe())
    except ImportError:
        pass
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return str(Path(candidate).resolve())
    raise SystemExit("ffmpeg not found. Supply --ffmpeg /absolute/path/to/ffmpeg")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg")
    parser.add_argument("--force", action="store_true", help="Regenerate previews that already exist")
    parser.add_argument("--only", nargs="+", choices=SOURCES, help="Limit regeneration to these sources; still verify and map all five")
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    exe = find_ffmpeg(args.ffmpeg)
    entries = []
    begin = time.monotonic()
    for index, name in enumerate(SOURCES, 1):
        source = VIDEO_DIR / name
        preview = VIDEO_DIR / (source.stem.replace("-720p-revised", "").replace("-720p", "") + "-480p.mp4")
        original = inspect_ffmpeg(exe, source)
        video_rate_cap = VIDEO_RATE_CAPS.get(name, 480)
        started = time.monotonic()
        print(f"[{index}/{len(SOURCES)}] {source.name}, {original['durationSeconds']:.2f}s", flush=True)
        if not args.verify_only and (args.force or not preview.exists()) and (not args.only or name in args.only):
            fps = min(30, original["fps"])
            filters = "scale=854:480:flags=lanczos,setsar=1"
            if original["fps"] > 30:
                filters += ",fps=30"
            temporary = preview.with_suffix(".tmp.mp4")
            command = [
                exe, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
                "-map", "0:v:0", "-map", "0:a:0", "-vf", filters,
                "-c:v", "libx264", "-preset", "medium", "-crf", "27",
                "-maxrate", f"{video_rate_cap}k", "-bufsize", f"{video_rate_cap * 2}k", "-pix_fmt", "yuv420p",
                "-profile:v", "high", "-level:v", "3.1", "-g", str(round(fps * 2)),
                "-keyint_min", str(math.ceil(fps)), "-sc_threshold", "0",
                "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", str(temporary),
            ]
            try:
                run(command)
                temporary.replace(preview)
            finally:
                if temporary.exists():
                    temporary.unlink()
        check = verify(exe, source, preview, original)
        original_bytes = source.stat().st_size
        preview_bytes = preview.stat().st_size
        entry = {
            "originalSrc": "assets/videos/" + source.name,
            "previewSrc": "assets/videos/" + preview.name,
            "originalBytes": original_bytes,
            "previewBytes": preview_bytes,
            "reductionPercent": round(100 * (1 - preview_bytes / original_bytes), 2),
            "maxVideoBitrateKbps": video_rate_cap,
            "original": original,
            "preview": check,
        }
        entries.append(entry)
        print(f"  {original_bytes:,} -> {preview_bytes:,} bytes ({entry['reductionPercent']:.1f}% less), verified, {time.monotonic() - started:.1f}s", flush=True)
    original_total = sum(entry["originalBytes"] for entry in entries)
    preview_total = sum(entry["previewBytes"] for entry in entries)
    manifest = {
        "version": 1,
        "encoding": {"width": 854, "height": 480, "maxFps": 30, "videoCodec": "h264", "crf": 27, "maxVideoBitrateKbps": 480, "perSourceVideoBitrateCapsKbps": VIDEO_RATE_CAPS, "audioCodec": "aac", "audioBitrateKbps": 64, "keyframeIntervalSeconds": 2, "faststart": True},
        "totals": {"originalBytes": original_total, "previewBytes": preview_total, "reductionPercent": round(100 * (1 - preview_total / original_total), 2)},
        "sources": {entry["originalSrc"]: entry["previewSrc"] for entry in entries},
        "videos": entries,
    }
    serialized = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    (VIDEO_DIR / "preview-manifest.json").write_text(serialized, encoding="utf-8")
    (ROOT / "tools" / "video-preview-manifest.json").write_text(serialized, encoding="utf-8")
    (ROOT / "dist" / "video-manifest.js").write_text(
        "window.VIDEO_PREVIEWS = " + json.dumps(manifest["sources"], ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Complete in {time.monotonic() - begin:.1f}s: {json.dumps(manifest['totals'])}", flush=True)


if __name__ == "__main__":
    main()
