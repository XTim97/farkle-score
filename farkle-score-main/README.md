# Farkle Score v1.2

A Vite + React Farkle scorekeeper.

## Version 1.2 changes

- Clean player selection with no default Player 1 / Player 2 entries.
- Requires at least two real players before starting a game.
- If exactly two saved players exist, both are selected automatically.
- If three or more saved players exist, choose at least two before starting.
- Player entry controls hide once enough players are saved.
- Continue button renamed to 🎲 Start Game.
- Winner screen shows only the winner panel.
- Winner panel includes winner name, winning score, Same Players, New Players, and Home.
- Same Players starts a new game immediately and randomizes the first player.
- Colored scoring buttons with progressively darker shades by scoring group.
- GitHub Pages base path and offline/PWA files included.

## Run locally

```bash
npm.cmd install
npm.cmd run dev
```

If PowerShell blocks npm scripts, use `npm.cmd` instead of `npm`.

If `npm.cmd install` times out, copy the `node_modules` folder from your previous working Farkle Score project into this folder, then run:

```bash
npm.cmd run dev
```


## Version 1.2.10

Adds an in-app Player Instructions Help Center on the Home screen. Help topics expand and collapse and work on desktop and touch devices.


### Version 1.2.10 layout update
- Player scoreboard is now directly above the active player.
- Active player total appears beside the player name.
- Current turn score is displayed compactly without the large black score box.
