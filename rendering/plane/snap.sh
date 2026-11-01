#!/bin/sh
# Renders one frame to a PNG: ./snap.sh out.png <scene> <cx> <cy> <zoom> [explode focus flows model yaw pitch anim]
out=$1; shift
cargo run -q --release --example snap -- "$@" 2>/dev/null > "$out.bmp" && sips -s format png "$out.bmp" --out "$out" >/dev/null && rm "$out.bmp"
