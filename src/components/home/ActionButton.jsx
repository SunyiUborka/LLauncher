import './ActionButton.css';

export default function ActionButton({ gameState, downloading, onAction, disabled }) {
  if (downloading) {
    return (
      <button className="action-button action-button--downloading" disabled>
        Downloading...
      </button>
    );
  }

  const getLabel = () => {
    if (!gameState) return 'Loading...';
    switch (gameState.status) {
      case 'not_installed': return 'Install';
      case 'update_available': return 'Update';
      case 'ready': return 'Launch';
      default: return 'Launch';
    }
  };

  const isDisabled = disabled || !gameState;

  return (
    <button
      className={`action-button ${isDisabled ? 'action-button--disabled' : ''}`}
      onClick={onAction}
      disabled={isDisabled}
    >
      {getLabel()}
    </button>
  );
}
