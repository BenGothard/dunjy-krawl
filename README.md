# dunjy-krawl
Dunjy Krawl: A lightweight web-based dungeon crawler by Ben Gothard. The game
now features simple character sprites so the player and enemies look more like
people and monsters instead of plain squares. It now includes multiple levels
that loop endlessly, increasing difficulty each time you clear all stages.

The interface has been overhauled with a vibrant retro theme powered by the
"Press Start 2P" font and polished styling so the game looks as fun as it
plays.

The start screen now proclaims **"Dunjy Krawl: Epic Quest"**, inviting players
to embark on an unforgettable adventure as soon as they load the page.

## GitHub Pages
The repository is configured with a GitHub Actions workflow that publishes the
contents of the `main` branch to GitHub Pages. Once the repository owner
enables the *GitHub Pages* feature, the latest version will be available at:

```
https://<your-github-username>.github.io/dunjy-krawl/
```

Simply push changes to `main` and the site will automatically deploy so anyone
can play the game from their browser.

## Controls

- Move with arrow keys or **WASD**
- Press **Space** to swing your weapon at the tile in front of you
- Press **F** to fire an arrow toward the mouse pointer
  - You start with 10 arrows displayed on the HUD
- Press **Enter** to begin on the start screen
- Press **R** to restart after a Game Over or Victory


## Testing

Run the project's unit tests with:

```bash
npm test
```
