import './GameStatus.css';

export default function GameStatus({ gameState }) {
  if (!gameState) {
    return (
      <div className="game-info">
        <div className="game-info__subtitle">Arknights: Endfield</div>
        <div className="game-info__title">Loading...</div>
      </div>
    );
  }

  const getBadge = () => {
    switch (gameState.status) {
      case 'ready':
        return { cls: 'game-info__badge--ready', text: 'Ready to play' };
      case 'update_available':
        return { cls: 'game-info__badge--update', text: 'Update available' };
      case 'not_installed':
        return { cls: 'game-info__badge--not-installed', text: 'Not installed' };
      default:
        return { cls: '', text: '' };
    }
  };

  const renderVersion = () => {
    switch (gameState.status) {
      case 'ready':
        return <span className="game-info__version">v{gameState.version}</span>;
      case 'update_available':
        return (
          <span className="game-info__version">
            v{gameState.installed_version}
            <span className="game-info__version-arrow">{'\u2192'}</span>
            v{gameState.latest_version}
          </span>
        );
      case 'not_installed':
        return <span className="game-info__version">v{gameState.latest_version}</span>;
      default:
        return null;
    }
  };

  const badge = getBadge();

  return (
    <div className="game-info">
      <div className="game-info__subtitle">Arknights: Endfield</div>
      <div className="game-info__title">Endfield</div>
      <div className="game-info__meta">
        <div className={`game-info__badge ${badge.cls}`}>
          <span className="game-info__badge-dot" />
          {badge.text}
        </div>
        {renderVersion()}
      </div>
    </div>
  );
}
