import './LanguageSelector.css';

const LANGUAGES = [
  { code: 'en-us', name: 'English' },
  { code: 'ru-ru', name: 'Russian' },
  { code: 'ja-jp', name: 'Japanese' },
  { code: 'ko-kr', name: 'Korean' },
  { code: 'zh-tw', name: 'Chinese (Traditional)' },
  { code: 'zh-cn', name: 'Chinese (Simplified)' },
  { code: 'de-de', name: 'German' },
  { code: 'fr-fr', name: 'French' },
  { code: 'es-es', name: 'Spanish' },
  { code: 'pt-br', name: 'Portuguese (Brazil)' },
  { code: 'id-id', name: 'Indonesian' },
  { code: 'th-th', name: 'Thai' },
  { code: 'vi-vn', name: 'Vietnamese' },
];

export default function LanguageSelector({ value, onChange }) {
  return (
    <select
      className="language-selector"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
