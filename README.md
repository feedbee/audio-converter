# Node.js CLI Audio Converter (Dockerized)

A robust command-line audio converter using Node.js and FFmpeg, wrapped in Docker for portability.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)

## Setup

1. **Build the Docker image:**
   ```bash
   docker build -t audio-converter .
   ```

## Usage

Run the container by mounting your current directory (or the directory containing your audio files) to `/usr/src/app` (or a specific data volume).

### Basic Syntax
```bash
docker run --rm -v "$(pwd):/data" audio-converter <input_files...> [options]
```

### Examples

**1. Convert a single file:**
```bash
docker run --rm -v "$(pwd):/data" audio-converter input.m4a
```

**2. Convert MULTIPLE files (Batch):**
```bash
docker run --rm -v "$(pwd):/data" audio-converter *.m4a
```
*Note: Your shell expands `*.m4a` into a list of files passed to the container.*

**3. Convert to WAV with specific bitrate:**
```bash
docker run --rm -v "$(pwd):/data" audio-converter song1.mp3 song2.mp3 -f wav -b 320k
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `[files...]` | Input audio file paths (Positional) | - |
| `-o, --output` | Output file path OR directory | `<input_name>.<format>` |
| `-f, --format` | Target format (mp3, wav, ogg, etc.) | `mp3` |
| `-b, --bitrate` | Audio bitrate (e.g., 128k, 320k) | Matches source file |

## Development (Local without Docker)

If you have `node` and `ffmpeg` installed on your host machine:

1. `npm install`
2. `node cli.js input.m4a`
