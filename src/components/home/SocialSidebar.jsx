import { openUrl } from '@tauri-apps/plugin-opener';
import SocialIcon from './SocialIcons';
import './SocialSidebar.css';

export default function SocialSidebar({ sidebars }) {
  if (!sidebars || sidebars.length === 0) return null;

  return (
    <div className="social-sidebar">
      {sidebars.map((item, i) => {
        const label = item.sidebar_labels?.[0]?.content || item.media || '';
        return (
          <button
            key={i}
            className="social-sidebar__btn"
            onClick={() => item.jump_url && openUrl(item.jump_url)}
            title={label}
          >
            <span className="social-sidebar__icon">
              <SocialIcon media={item.media} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
