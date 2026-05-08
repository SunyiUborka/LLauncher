import { useState } from 'react';
import LogViewer from '../common/LogViewer';
import { useTranslation } from '../../i18n';
import './LaunchFailedDialog.css';

export default function LaunchFailedDialog({ failure, onClose }) {
  const { t } = useTranslation();
  const [showFullLog, setShowFullLog] = useState(false);

  if (!failure) return null;

  const exitText = failure.exit_code != null
    ? t('launchFailed.exitCode', { code: failure.exit_code })
    : t('launchFailed.exitCodeUnknown');

  const tail = (failure.log_tail || '').trim();

  return (
    <>
      <div className="launch-failed-overlay" onClick={onClose}>
        <div className="launch-failed" onClick={(e) => e.stopPropagation()}>
          <div className="launch-failed__header">
            <span className="launch-failed__title">{t('launchFailed.title')}</span>
            <button className="launch-failed__close" onClick={onClose}>{'✕'}</button>
          </div>
          <div className="launch-failed__body">
            <div className="launch-failed__exit">{exitText}</div>
            {tail ? (
              <pre className="launch-failed__tail">{tail}</pre>
            ) : (
              <div className="launch-failed__empty">{t('launchFailed.noLog')}</div>
            )}
            <div className="launch-failed__actions">
              <button
                className="launch-failed__btn launch-failed__btn--secondary"
                onClick={() => setShowFullLog(true)}
              >
                {t('launchFailed.viewLog')}
              </button>
              <button
                className="launch-failed__btn launch-failed__btn--primary"
                onClick={onClose}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showFullLog && <LogViewer onClose={() => setShowFullLog(false)} />}
    </>
  );
}
