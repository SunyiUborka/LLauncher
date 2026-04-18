import { useState } from 'react';
import './MainLayout.css';

export default function MainLayout({ backgroundUrl, children }) {
  const [bgLoaded, setBgLoaded] = useState(false);

  return (
    <div className="main-layout">
      <div className="main-layout__background">
        {backgroundUrl && (
          <img
            src={backgroundUrl}
            alt=""
            className={bgLoaded ? 'loaded' : ''}
            onLoad={() => setBgLoaded(true)}
          />
        )}
      </div>
      <div className="main-layout__overlay" />
      <div className="main-layout__content">
        {children}
      </div>
    </div>
  );
}
