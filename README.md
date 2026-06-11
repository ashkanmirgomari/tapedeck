# 🎧 Pixel Lofi Player

<div align="center">

![Pixel Lofi Player](https://img.shields.io/badge/status-complete-b886c4?style=flat-square)
![Flask](https://img.shields.io/badge/Flask-3.0-0d0a1a?style=flat-square&logo=flask)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-d4a5e5?style=flat-square&logo=javascript)
![License](https://img.shields.io/badge/license-MIT-7a6b9e?style=flat-square)

*A retro pixel-art music player with dark lo-fi aesthetic, built with Flask & pure JavaScript*

</div>

---

## ✨ Preview

<div align="center">
  <p><i>A nostalgic Walkman-inspired music player with CRT effects, floating particles, starry night sky.</i></p>
</div>

---

## 🎵 Features

### Core Player
- 🎧 **Music Player** - Play, pause, next, previous controls
- 📼 **Pixel Art Cassette** - Animated cassette that wiggles while playing
- 📋 **Playlist** - Client-side file upload (no server storage)
- 🔀 **Shuffle Mode** - Random track playback
- 🔁 **Repeat Modes** - Off / Repeat All / Repeat One
- 🔊 **Volume Control** - Pixel-styled volume slider
- 📊 **Real-time Visualizer** - 16-bar frequency visualizer using Web Audio API

### Visual Effects
- 🖱️ **Mouse Particles** - Dark minimalist particles follow your cursor
- 📺 **CRT Effects** - Chromatic aberration, screen tear, flicker, scanlines
- ✨ **Floating Dust** - Slow-moving dust particles with glow
- 🌠 **Night Sky** - Twinkling stars, shooting meteors, drifting pixel clouds

### Characters & Decor
- 🐱 **Pinto the Cat** - Sits on top of the player, meows when clicked
- 👧 **Lo-Fi Girl** - Sitting at the bottom-left (PC only)
- ❤️ **Beating Heart Copyright** - "Made With ❤️ By Ashkan Mirgomari & DeepSeek"

### Extra Features
- 📓 **Pixel Notebook** - Write notes, auto-save to LocalStorage
- ⚠️ **Custom Error Box** - Pixel-styled error messages (no alert popups)
- 💾 **Settings Memory** - Remembers volume, shuffle, repeat, playlist names
- 🎹 **Keyboard Controls** - Space (play/pause), Arrows (prev/next)
- 📱 **Responsive** - Optimized for both desktop and mobile

### Supported Formats
- MP3, WAV, OGG, FLAC, AAC, M4A, WMA, Opus, WebM

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/ashkanmirgomari/pixel-lofi-player.git

# Navigate to project
cd pixel-lofi-player

# Install dependencies
pip install -r requirements.txt

# Run the app
python app.py