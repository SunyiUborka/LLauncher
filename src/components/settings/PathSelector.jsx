import { open } from '@tauri-apps/plugin-dialog';
import { useTranslation } from '../../i18n';
import './PathSelector.css';

export default function PathSelector({ value, onChange }) {
  const { t } = useTranslation();
  const handleBrowse = async () => {
    const selected = await open({ directory: true });
    if (selected) {
      onChange(selected);
    }
  };

  return (
    <div className="path-selector">
      <input
        className="path-selector__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
      <button className="path-selector__btn" onClick={handleBrowse}>
        {t('common.browse')}
      </button>
    </div>
  );
}
