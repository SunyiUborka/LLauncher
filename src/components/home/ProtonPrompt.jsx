import useProtonDownload from '../../hooks/useProtonDownload';
import { formatSize, formatSpeed, formatPercent } from '../../utils/format';
import './ProtonPrompt.css';

export default function ProtonPrompt({ onClose, onConfigureManually, onDownloadComplete }) {
  const { downloading, progress, error, startDownload, cancelDownload } =
    useProtonDownload(onDownloadComplete);

  return (
    <div className="proton-prompt-overlay" onClick={onClose}>
      <div className="proton-prompt" onClick={(e) => e.stopPropagation()}>
        <div className="proton-prompt__header">
          <span className="proton-prompt__title">DWProton Required</span>
          <button className="proton-prompt__close" onClick={onClose}>
            {'\u2715'}
          </button>
        </div>

        <div className="proton-prompt__body">
          {!downloading && !error && (
            <>
              <p className="proton-prompt__text">
                DWProton is not found. It is required to run the game on Linux.
                Would you like to download it automatically?
              </p>
              <div className="proton-prompt__actions">
                <button
                  className="proton-prompt__btn proton-prompt__btn--primary"
                  onClick={startDownload}
                >
                  Download DWProton
                </button>
                <button
                  className="proton-prompt__btn proton-prompt__btn--secondary"
                  onClick={onConfigureManually}
                >
                  Configure manually
                </button>
              </div>
            </>
          )}

          {downloading && progress && (
            <div className="proton-prompt__progress">
              <div className="proton-prompt__progress-info">
                <span>{progress.stage === 'extracting' ? 'Extracting...' : 'Downloading...'}</span>
                <span>
                  {formatPercent(progress.bytes_downloaded, progress.bytes_total)}
                  {progress.speed_bps > 0 && ` \u2022 ${formatSpeed(progress.speed_bps)}`}
                </span>
              </div>
              <div className="proton-prompt__progress-bar">
                <div
                  className="proton-prompt__progress-fill"
                  style={{
                    width: progress.bytes_total > 0
                      ? `${(progress.bytes_downloaded / progress.bytes_total) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <div className="proton-prompt__progress-detail">
                {formatSize(progress.bytes_downloaded)} / {formatSize(progress.bytes_total)}
              </div>
              <button
                className="proton-prompt__btn proton-prompt__btn--secondary"
                onClick={cancelDownload}
              >
                Cancel
              </button>
            </div>
          )}

          {error && (
            <div className="proton-prompt__error">
              <p className="proton-prompt__error-text">{error}</p>
              <div className="proton-prompt__actions">
                <button
                  className="proton-prompt__btn proton-prompt__btn--primary"
                  onClick={startDownload}
                >
                  Retry
                </button>
                <button
                  className="proton-prompt__btn proton-prompt__btn--secondary"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
