# Inverse Gravity Tetris

A lightweight, browser-hosted Tetris variant where gravity pulls pieces toward the sky instead of the ground.

## Playing locally

1. Start a local web server from the project root (Python is preinstalled on most systems):

   ```bash
   python -m http.server 8000
   ```

2. Open http://localhost:8000 in your browser.

3. Use the controls below to keep the tower from touching the ceiling.

## Controls

- **Left / Right**: move sideways
- **Down**: accelerate the upward drift
- **Up**: rotate
- **Space**: hard drop upward
- **P**: pause/resume
- **Restart button**: start over instantly

## Notes

- Completed rows vanish and are replaced with empty space at the bottom, matching the upward gravity theme.
- Difficulty ramps up by shrinking the gravity interval as you clear lines.
- All logic is contained in `main.js`; no build step or extra dependencies are required.
