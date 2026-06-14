# GitHub Pages Homepage

The project can use GitHub Pages as its public homepage.

Recommended homepage URL:

```txt
https://mikara89.github.io/cap-nestjs/
```

Recommended setup:

1. Open the repository on GitHub.
2. Go to **Settings** > **Pages**.
3. Set the source to **Deploy from a branch**.
4. Choose the `main` branch and `/docs` folder.
5. Save the settings and wait for the Pages deployment to finish.
6. Add the Pages URL to the repository **About** website field.

The package metadata uses the Pages URL as `homepage`. Keep that URL stable once
packages are published.

If the documentation later needs navigation, search, or custom styling, add a
static docs generator and publish its output to Pages. The current `/docs`
folder is suitable for a simple first public homepage.
