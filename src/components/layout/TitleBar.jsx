import { getCurrentWindow } from '@tauri-apps/api/window';
import './TitleBar.css';

const appWindow = getCurrentWindow();

export default function TitleBar() {
  return (
    <div className="titlebar" data-tauri-drag-region>
      <span className="titlebar__title">LLauncher</span>
      <div className="titlebar__controls">
        <button
          className="titlebar__btn"
          onClick={() => appWindow.minimize()}
          title="Minimize"
        >
          <svg viewBox="0 0 16 16">
            <rect x="3" y="7.5" width="10" height="1" />
          </svg>
        </button>
        <button
          className="titlebar__btn titlebar__btn--close"
          onClick={() => appWindow.hide()}
          title="Close"
        >
          <svg viewBox="0 0 16 16">
            <path d="M4.5 3.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
        </button>
      </div>
    </div>
  );
}
