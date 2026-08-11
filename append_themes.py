themes_css = """
/* EXTENDED THEMES */
[data-theme='dracula'] {
  --bg-primary: #282a36;
  --bg-secondary: #44475a;
  --bg-tertiary: #6272a4;
  --text-primary: #f8f8f2;
  --text-secondary: #bfbfbf;
  --border-color: #44475a;
  --border-hover: #6272a4;
  --card-bg: #282a36;
  --shadow-ambient: rgba(0, 0, 0, 0.4);
}
[data-theme='nord'] {
  --bg-primary: #2e3440;
  --bg-secondary: #3b4252;
  --bg-tertiary: #434c5e;
  --text-primary: #eceff4;
  --text-secondary: #d8dee9;
  --border-color: #3b4252;
  --border-hover: #4c566a;
  --card-bg: #2e3440;
}
[data-theme='gruvbox-dark'] {
  --bg-primary: #282828;
  --bg-secondary: #3c3836;
  --bg-tertiary: #504945;
  --text-primary: #ebdbb2;
  --text-secondary: #a89984;
  --border-color: #3c3836;
  --border-hover: #504945;
  --card-bg: #282828;
}
[data-theme='gruvbox-light'] {
  --bg-primary: #fbf1c7;
  --bg-secondary: #ebdbb2;
  --bg-tertiary: #d5c4a1;
  --text-primary: #3c3836;
  --text-secondary: #504945;
  --border-color: #d5c4a1;
  --border-hover: #bdae93;
  --card-bg: #fbf1c7;
}
[data-theme='monokai'] {
  --bg-primary: #272822;
  --bg-secondary: #3e3d32;
  --bg-tertiary: #49483e;
  --text-primary: #f8f8f2;
  --text-secondary: #ccccc6;
  --border-color: #3e3d32;
  --border-hover: #75715e;
  --card-bg: #272822;
}
[data-theme='tokyo-night'] {
  --bg-primary: #1a1b26;
  --bg-secondary: #24283b;
  --bg-tertiary: #292e42;
  --text-primary: #c0caf5;
  --text-secondary: #a9b1d6;
  --border-color: #24283b;
  --border-hover: #414868;
  --card-bg: #1a1b26;
}
[data-theme='synthwave'] {
  --bg-primary: #2b213a;
  --bg-secondary: #241b2f;
  --bg-tertiary: #262335;
  --text-primary: #ffffff;
  --text-secondary: #8e8e8e;
  --border-color: #495495;
  --border-hover: #61afef;
  --card-bg: #2b213a;
}
[data-theme='solarized-dark'] {
  --bg-primary: #002b36;
  --bg-secondary: #073642;
  --bg-tertiary: #586e75;
  --text-primary: #839496;
  --text-secondary: #93a1a1;
  --border-color: #073642;
  --border-hover: #586e75;
  --card-bg: #002b36;
}
[data-theme='solarized-light'] {
  --bg-primary: #fdf6e3;
  --bg-secondary: #eee8d5;
  --bg-tertiary: #93a1a1;
  --text-primary: #657b83;
  --text-secondary: #586e75;
  --border-color: #eee8d5;
  --border-hover: #93a1a1;
  --card-bg: #fdf6e3;
}
[data-theme='catppuccin-mocha'] {
  --bg-primary: #1e1e2e;
  --bg-secondary: #181825;
  --bg-tertiary: #313244;
  --text-primary: #cdd6f4;
  --text-secondary: #bac2de;
  --border-color: #313244;
  --border-hover: #45475a;
  --card-bg: #1e1e2e;
}
[data-theme='catppuccin-latte'] {
  --bg-primary: #eff1f5;
  --bg-secondary: #e6e9ef;
  --bg-tertiary: #ccd0da;
  --text-primary: #4c4f69;
  --text-secondary: #5c5f77;
  --border-color: #ccd0da;
  --border-hover: #bcc0cc;
  --card-bg: #eff1f5;
}
[data-theme='oceanic-next'] {
  --bg-primary: #1B2B34;
  --bg-secondary: #343D46;
  --bg-tertiary: #4F5B66;
  --text-primary: #D8DEE9;
  --text-secondary: #A6ACCD;
  --border-color: #343D46;
  --border-hover: #4F5B66;
  --card-bg: #1B2B34;
}
[data-theme='one-dark'] {
  --bg-primary: #282c34;
  --bg-secondary: #21252b;
  --bg-tertiary: #3b4048;
  --text-primary: #abb2bf;
  --text-secondary: #5c6370;
  --border-color: #21252b;
  --border-hover: #3b4048;
  --card-bg: #282c34;
}
[data-theme='one-light'] {
  --bg-primary: #fafafa;
  --bg-secondary: #f0f0f0;
  --bg-tertiary: #e5e5e5;
  --text-primary: #383a42;
  --text-secondary: #a0a1a7;
  --border-color: #e5e5e5;
  --border-hover: #d3d3d3;
  --card-bg: #fafafa;
}
[data-theme='github-dark'] {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-tertiary: #21262d;
  --text-primary: #c9d1d9;
  --text-secondary: #8b949e;
  --border-color: #30363d;
  --border-hover: #8b949e;
  --card-bg: #0d1117;
}
[data-theme='github-light'] {
  --bg-primary: #ffffff;
  --bg-secondary: #f6f8fa;
  --bg-tertiary: #eaeef2;
  --text-primary: #24292f;
  --text-secondary: #57606a;
  --border-color: #d0d7de;
  --border-hover: #afb8c1;
  --card-bg: #ffffff;
}
[data-theme='rose-pine'] {
  --bg-primary: #191724;
  --bg-secondary: #1f1d2e;
  --bg-tertiary: #26233a;
  --text-primary: #e0def4;
  --text-secondary: #908caa;
  --border-color: #26233a;
  --border-hover: #6e6a86;
  --card-bg: #191724;
}
[data-theme='rose-pine-dawn'] {
  --bg-primary: #faf4ed;
  --bg-secondary: #fffaf3;
  --bg-tertiary: #dfdad9;
  --text-primary: #575279;
  --text-secondary: #797593;
  --border-color: #dfdad9;
  --border-hover: #cecacd;
  --card-bg: #faf4ed;
}
[data-theme='cyberpunk'] {
  --bg-primary: #0f0f16;
  --bg-secondary: #1a1a24;
  --bg-tertiary: #262635;
  --text-primary: #e2e2e8;
  --text-secondary: #9e9ea7;
  --border-color: #fcee0a;
  --border-hover: #ff003c;
  --card-bg: #0f0f16;
}
[data-theme='midnight-blue'] {
  --bg-primary: #0b0f19;
  --bg-secondary: #111827;
  --bg-tertiary: #1f2937;
  --text-primary: #f3f4f6;
  --text-secondary: #9ca3af;
  --border-color: #1f2937;
  --border-hover: #374151;
  --card-bg: #0b0f19;
}
[data-theme='forest'] {
  --bg-primary: #131c16;
  --bg-secondary: #1a261e;
  --bg-tertiary: #24362a;
  --text-primary: #e8f5e9;
  --text-secondary: #a5d6a7;
  --border-color: #24362a;
  --border-hover: #385942;
  --card-bg: #131c16;
}
[data-theme='sunset'] {
  --bg-primary: #1c1315;
  --bg-secondary: #261a1d;
  --bg-tertiary: #382529;
  --text-primary: #ffedd5;
  --text-secondary: #fed7aa;
  --border-color: #382529;
  --border-hover: #54363d;
  --card-bg: #1c1315;
}
"""

with open('src/app/globals.css', 'a') as f:
    f.write(themes_css)
