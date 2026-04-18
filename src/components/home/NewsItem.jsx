import { openUrl } from '@tauri-apps/plugin-opener';
import './NewsItem.css';

export default function NewsItem({ item, index }) {
  const handleClick = () => {
    if (item.jump_url) {
      openUrl(item.jump_url);
    }
  };

  return (
    <div
      className="news-item"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={handleClick}
    >
      <span className="news-item__dot" />
      <span className="news-item__text">{item.content}</span>
    </div>
  );
}
