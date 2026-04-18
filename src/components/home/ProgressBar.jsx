import { formatSize, formatSpeed, formatEta } from '../../utils/format';
import './ProgressBar.css';

export default function ProgressBar({ progress, onCancel }) {
  if (!progress) return null;

  const percent = progress.bytes_total > 0
    ? Math.round((progress.bytes_downloaded / progress.bytes_total) * 100)
    : 0;

  return (
    <div className="progress-bar">
      <div className="progress-bar__track">
        <div
          className="progress-bar__fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="progress-bar__info">
        <span>
          {formatSize(progress.bytes_downloaded)} / {formatSize(progress.bytes_total)}
          {' \u2014 '}{percent}%
        </span>
        <span>
          {formatSpeed(progress.speed_bps)}
          {(() => {
            const eta = formatEta(progress.bytes_total - progress.bytes_downloaded, progress.speed_bps);
            return eta ? ` — ${eta}` : '';
          })()}
        </span>
      </div>
      <div className="progress-bar__file">
        File {progress.file_index + 1}/{progress.total_files}: {progress.file_name}
        <button className="progress-bar__cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
