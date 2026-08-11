export interface ThemeCombo {
  id: string;
  name: string;
  type: 'dark' | 'light';
  previewBg: string;
  previewAccent: string;
}

export const THEME_COMBOS: ThemeCombo[] = [
  { id: 'light', name: 'Clean Light', type: 'light', previewBg: '#FCFCFC', previewAccent: '#007aff' },
  { id: 'dark', name: 'Clean Dark', type: 'dark', previewBg: '#09090B', previewAccent: '#007aff' },
  { id: 'dracula', name: 'Dracula', type: 'dark', previewBg: '#282a36', previewAccent: '#bd93f9' },
  { id: 'nord', name: 'Nord', type: 'dark', previewBg: '#2e3440', previewAccent: '#88c0d0' },
  { id: 'gruvbox-dark', name: 'Gruvbox Dark', type: 'dark', previewBg: '#282828', previewAccent: '#fe8019' },
  { id: 'gruvbox-light', name: 'Gruvbox Light', type: 'light', previewBg: '#fbf1c7', previewAccent: '#d65d0e' },
  { id: 'monokai', name: 'Monokai', type: 'dark', previewBg: '#272822', previewAccent: '#a6e22e' },
  { id: 'tokyo-night', name: 'Tokyo Night', type: 'dark', previewBg: '#1a1b26', previewAccent: '#7aa2f7' },
  { id: 'synthwave', name: 'Synthwave', type: 'dark', previewBg: '#2b213a', previewAccent: '#f92aad' },
  { id: 'solarized-dark', name: 'Solarized Dark', type: 'dark', previewBg: '#002b36', previewAccent: '#268bd2' },
  { id: 'solarized-light', name: 'Solarized Light', type: 'light', previewBg: '#fdf6e3', previewAccent: '#2aa198' },
  { id: 'catppuccin-mocha', name: 'Catppuccin', type: 'dark', previewBg: '#1e1e2e', previewAccent: '#cba6f7' },
  { id: 'catppuccin-latte', name: 'Latte', type: 'light', previewBg: '#eff1f5', previewAccent: '#8839ef' },
  { id: 'oceanic-next', name: 'Oceanic', type: 'dark', previewBg: '#1B2B34', previewAccent: '#6699CC' },
  { id: 'one-dark', name: 'One Dark', type: 'dark', previewBg: '#282c34', previewAccent: '#61afef' },
  { id: 'one-light', name: 'One Light', type: 'light', previewBg: '#fafafa', previewAccent: '#0184bc' },
  { id: 'github-dark', name: 'GitHub Dark', type: 'dark', previewBg: '#0d1117', previewAccent: '#58a6ff' },
  { id: 'github-light', name: 'GitHub Light', type: 'light', previewBg: '#ffffff', previewAccent: '#0969da' },
  { id: 'rose-pine', name: 'Rosé Pine', type: 'dark', previewBg: '#191724', previewAccent: '#ebbcba' },
  { id: 'rose-pine-dawn', name: 'Rosé Dawn', type: 'light', previewBg: '#faf4ed', previewAccent: '#d27e99' },
  { id: 'cyberpunk', name: 'Cyberpunk', type: 'dark', previewBg: '#0f0f16', previewAccent: '#fcee0a' },
  { id: 'midnight-blue', name: 'Midnight', type: 'dark', previewBg: '#0b0f19', previewAccent: '#3b82f6' },
  { id: 'forest', name: 'Forest', type: 'dark', previewBg: '#131c16', previewAccent: '#4ade80' },
  { id: 'sunset', name: 'Sunset', type: 'dark', previewBg: '#1c1315', previewAccent: '#fb923c' },
];
