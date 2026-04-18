import { useState } from 'react';
import TitleBar from './components/layout/TitleBar';
import MainLayout from './components/layout/MainLayout';
import HomePage from './components/home/HomePage';
import SettingsModal from './components/settings/SettingsModal';
import useLauncherContent from './hooks/useLauncherContent';
import useSettings from './hooks/useSettings';
import useSystemCheck from './hooks/useSystemCheck';

export default function App() {
  const { content } = useLauncherContent();
  const { settings, saveSettings } = useSettings();
  const { systemCheck, refresh: refreshSystemCheck } = useSystemCheck();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <MainLayout backgroundUrl={content?.background?.url}>
      <TitleBar />
      <HomePage
        content={content}
        settings={settings}
        systemCheck={systemCheck}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          systemCheck={systemCheck}
          onRefreshSystemCheck={refreshSystemCheck}
          onSave={saveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </MainLayout>
  );
}
