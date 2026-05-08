import { formatSize, formatSpeed, formatEta } from '../../utils/format';
import { useTranslation } from '../../i18n';
import './ProgressBar.css';

export default function ProgressBar({ progress, onCancel }) {
  const { t } = useTranslation();
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
          {' — '}{percent}%
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
        {t('progress.fileLabel', {
          current: progress.file_index + 1,
          total: progress.total_files,
          name: progress.file_name,
        })}
        <button className="progress-bar__cancel" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
