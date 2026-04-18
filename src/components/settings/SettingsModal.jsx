import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import PathSelector from './PathSelector';
import LanguageSelector from './LanguageSelector';
import useProtonDownload from '../../hooks/useProtonDownload';
import { formatSize, formatSpeed, formatPercent } from '../../utils/format';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import './SettingsModal.css';

const TABS = [
  { id: 'paths', label: 'Paths' },
  { id: 'proton', label: 'Proton' },
  { id: 'launch', label: 'Launch' },
  { id: 'downloads', label: 'Downloads' },
];

export default function SettingsModal({ settings, systemCheck, onRefreshSystemCheck, onSave, onClose }) {
  const [form, setForm] = useState(null);
  const [activeTab, setActiveTab] = useState('paths');
  const [speedUnit, setSpeedUnit] = useState('MB/s');
  const [releases, setReleases] = useState([]);
  const [installedProtons, setInstalledProtons] = useState([]);
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [autostart, setAutostart] = useState(false);

  const fetchInstalled = useCallback(async () => {
    try {
      const list = await invoke('list_installed_protons');
      setInstalledProtons(list);
    } catch (e) {
      console.error('Failed to list installed protons:', e);
    }
  }, []);

  const onProtonComplete = useCallback((payload) => {
    if (payload?.proton_dir) {
      setForm((prev) => prev ? { ...prev, proton_dir: payload.proton_dir } : prev);
    }
    fetchInstalled();
    if (onRefreshSystemCheck) onRefreshSystemCheck();
  }, [fetchInstalled, onRefreshSystemCheck]);

  const { downloading: protonDownloading, progress: protonProgress, error: protonError, startDownload: startProtonDownload, cancelDownload: cancelProtonDownload } =
    useProtonDownload(onProtonComplete);

  useEffect(() => {
    if (settings) {
      setForm({ ...settings });
      if (settings.download_speed_limit > 0 && settings.download_speed_limit < 1024 * 1024) {
        setSpeedUnit('KB/s');
      }
    }
  }, [settings]);

  const fetchReleases = useCallback(async () => {
    setReleasesLoading(true);
    try {
      const list = await invoke('list_dwproton_releases');
      setReleases(list);
    } catch (e) {
      console.error('Failed to list proton releases:', e);
    } finally {
      setReleasesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'launch') {
      isEnabled().then(setAutostart).catch(console.error);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'proton') {
      fetchReleases();
      fetchInstalled();
    }
  }, [activeTab, fetchReleases, fetchInstalled]);

  if (!form) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAutostartToggle = async () => {
    try {
      if (autostart) {
        await disable();
      } else {
        await enable();
      }
      const status = await isEnabled();
      setAutostart(status);
    } catch (e) {
      console.error('Failed to toggle autostart:', e);
    }
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const handleProtonDownload = (release) => {
    startProtonDownload(release || undefined);
  };

  const handleSetActiveProton = async (path) => {
    try {
      await invoke('set_active_proton', { path });
      setForm((prev) => prev ? { ...prev, proton_dir: path } : prev);
      if (onRefreshSystemCheck) onRefreshSystemCheck();
    } catch (e) {
      console.error('Failed to set active proton:', e);
    }
  };

  const findInstalled = (tagName) => {
    return installedProtons.find((p) => p.name === tagName || p.name.startsWith(tagName + '-'));
  };

  const isInstalled = (tagName) => {
    return !!findInstalled(tagName);
  };

  const getInstalledPath = (tagName) => {
    return findInstalled(tagName)?.path || null;
  };

  const isActive = (tagName) => {
    if (!form?.proton_dir) return false;
    const installed = findInstalled(tagName);
    return installed ? form.proton_dir.startsWith(installed.path) : false;
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal__header">
          <span className="settings-modal__title">Settings</span>
          <button className="settings-modal__close" onClick={onClose}>
            {'\u2715'}
          </button>
        </div>

        <div className="settings-modal__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`settings-modal__tab ${activeTab === tab.id ? 'settings-modal__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-modal__body">
          {activeTab === 'paths' && (
            <>
              <div className="settings-modal__section">
                <span className="settings-modal__label">Game directory</span>
                <PathSelector
                  value={form.game_dir}
                  onChange={(v) => handleChange('game_dir', v)}
                />
              </div>

              <div className="settings-modal__section">
                <span className="settings-modal__label">Download directory</span>
                <PathSelector
                  value={form.download_dir}
                  onChange={(v) => handleChange('download_dir', v)}
                />
                <span className="settings-modal__hint">Temporary directory for downloaded archives</span>
              </div>

              <div className="settings-modal__section">
                <span className="settings-modal__label">Language</span>
                <LanguageSelector
                  value={form.language}
                  onChange={(v) => handleChange('language', v)}
                />
              </div>
            </>
          )}

          {activeTab === 'proton' && (
            <>
              <div className="settings-modal__section">
                <span className="settings-modal__label">Active DWProton</span>
                <PathSelector
                  value={form.proton_dir}
                  onChange={(v) => handleChange('proton_dir', v)}
                />
                <span className="settings-modal__hint">
                  Status: {systemCheck?.has_proton ? 'Ready' : 'Not found'}
                </span>
              </div>

              <div className="settings-modal__section">
                <div className="settings-proton__header">
                  <span className="settings-modal__label">Available versions</span>
                  <button
                    className="settings-proton__refresh-btn"
                    onClick={() => { fetchReleases(); fetchInstalled(); }}
                    disabled={releasesLoading}
                  >
                    {releasesLoading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {releasesLoading && releases.length === 0 ? (
                  <span className="settings-modal__hint">Loading releases...</span>
                ) : releases.length > 0 ? (
                  <div className="settings-proton__list">
                    {releases.map((r) => {
                      const installed = isInstalled(r.tag_name);
                      const active = isActive(r.tag_name);
                      return (
                        <div key={r.tag_name} className={`settings-proton__item ${active ? 'settings-proton__item--active' : ''}`}>
                          <div className="settings-proton__item-info">
                            <span className="settings-proton__item-name">
                              {r.tag_name}
                              {active && <span className="settings-proton__badge settings-proton__badge--active">Active</span>}
                              {installed && !active && <span className="settings-proton__badge settings-proton__badge--installed">Installed</span>}
                            </span>
                            <span className="settings-proton__item-meta">
                              {r.published_at || 'unknown'} &middot; {formatSize(r.size)}
                            </span>
                          </div>
                          <div className="settings-proton__item-actions">
                            {installed ? (
                              !active && (
                                <button
                                  className="settings-proton__use-btn"
                                  onClick={() => handleSetActiveProton(getInstalledPath(r.tag_name))}
                                >
                                  Use
                                </button>
                              )
                            ) : (
                              <button
                                className="settings-proton__dl-btn"
                                onClick={() => handleProtonDownload(r)}
                                disabled={protonDownloading}
                              >
                                Download
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="settings-modal__hint">No releases found</span>
                )}
              </div>

              {protonDownloading && protonProgress && (
                <div className="settings-proton__progress">
                  <div className="settings-proton__progress-info">
                    <span>{protonProgress.stage === 'extracting' ? 'Extracting...' : 'Downloading...'}</span>
                    <span>
                      {formatPercent(protonProgress.bytes_downloaded, protonProgress.bytes_total)}
                      {protonProgress.speed_bps > 0 && ` \u2022 ${formatSpeed(protonProgress.speed_bps)}`}
                    </span>
                  </div>
                  <div className="settings-proton__progress-bar">
                    <div
                      className="settings-proton__progress-fill"
                      style={{
                        width: protonProgress.bytes_total > 0
                          ? `${(protonProgress.bytes_downloaded / protonProgress.bytes_total) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <div className="settings-proton__progress-detail">
                    {formatSize(protonProgress.bytes_downloaded)} / {formatSize(protonProgress.bytes_total)}
                  </div>
                  <button
                    className="settings-modal__btn settings-modal__btn--cancel"
                    onClick={cancelProtonDownload}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {protonError && (
                <div className="settings-proton__error">{protonError}</div>
              )}
            </>
          )}

          {activeTab === 'launch' && (
            <>
              <div className="settings-toggle">
                <div className="settings-toggle__info">
                  <span className="settings-toggle__name">Launch at startup</span>
                  <span className="settings-toggle__desc">
                    Automatically start LLauncher when you log in
                  </span>
                </div>
                <button
                  className={`settings-toggle__switch ${autostart ? 'settings-toggle__switch--on' : ''}`}
                  onClick={handleAutostartToggle}
                />
              </div>

              <div className="settings-modal__section">
                <span className="settings-modal__label">After game launch</span>
                <select
                  className="settings-proton__select"
                  value={form.on_launch_action || 'hide'}
                  onChange={(e) => handleChange('on_launch_action', e.target.value)}
                >
                  <option value="hide">Hide launcher</option>
                  <option value="close">Close launcher</option>
                  <option value="nothing">Keep open</option>
                </select>
              </div>

              <div className="settings-toggle">
                <div className="settings-toggle__info">
                  <span className="settings-toggle__name">Native Vulkan</span>
                  <span className="settings-toggle__desc">
                    Use the game's built-in Vulkan renderer (-vulkan)
                  </span>
                </div>
                <button
                  className={`settings-toggle__switch ${form.use_native_vulkan ? 'settings-toggle__switch--on' : ''}`}
                  onClick={() => handleChange('use_native_vulkan', !form.use_native_vulkan)}
                />
              </div>

              <div className="settings-toggle">
                <div className="settings-toggle__info">
                  <span className="settings-toggle__name">Wayland</span>
                  <span className="settings-toggle__desc">
                    Enable Wayland support in Proton (PROTON_ENABLE_WAYLAND=1)
                  </span>
                </div>
                <button
                  className={`settings-toggle__switch ${form.use_wayland ? 'settings-toggle__switch--on' : ''}`}
                  onClick={() => handleChange('use_wayland', !form.use_wayland)}
                />
              </div>

              <div className="settings-toggle">
                <div className="settings-toggle__info">
                  <span className="settings-toggle__name">GameMode</span>
                  <span className="settings-toggle__desc">
                    Optimize CPU governor for gaming via gamemoderun
                  </span>
                  {systemCheck && !systemCheck.has_gamemode && (
                    <span className="settings-toggle__unavailable">Not installed</span>
                  )}
                </div>
                <button
                  className={`settings-toggle__switch ${form.use_gamemode ? 'settings-toggle__switch--on' : ''}`}
                  onClick={() => handleChange('use_gamemode', !form.use_gamemode)}
                />
              </div>

              <div className="settings-toggle">
                <div className="settings-toggle__info">
                  <span className="settings-toggle__name">DXVK Async</span>
                  <span className="settings-toggle__desc">
                    Async shader compilation via DXVK (reduces stuttering)
                  </span>
                </div>
                <button
                  className={`settings-toggle__switch ${form.use_dxvk_async ? 'settings-toggle__switch--on' : ''}`}
                  onClick={() => handleChange('use_dxvk_async', !form.use_dxvk_async)}
                />
              </div>

              <div className="settings-toggle">
                <div className="settings-toggle__info">
                  <span className="settings-toggle__name">Disable Fsync</span>
                  <span className="settings-toggle__desc">
                    Disable Proton fsync (PROTON_NO_FSYNC=1)
                  </span>
                </div>
                <button
                  className={`settings-toggle__switch ${form.disable_fsync ? 'settings-toggle__switch--on' : ''}`}
                  onClick={() => handleChange('disable_fsync', !form.disable_fsync)}
                />
              </div>

              <div className="settings-toggle">
                <div className="settings-toggle__info">
                  <span className="settings-toggle__name">Disable Esync</span>
                  <span className="settings-toggle__desc">
                    Disable Proton esync (PROTON_NO_ESYNC=1)
                  </span>
                </div>
                <button
                  className={`settings-toggle__switch ${form.disable_esync ? 'settings-toggle__switch--on' : ''}`}
                  onClick={() => handleChange('disable_esync', !form.disable_esync)}
                />
              </div>

              <div className="settings-toggle">
                <div className="settings-toggle__info">
                  <span className="settings-toggle__name">MangoHud</span>
                  <span className="settings-toggle__desc">
                    Show FPS / frame time overlay
                  </span>
                  {systemCheck && !systemCheck.has_mangohud && (
                    <span className="settings-toggle__unavailable">Not installed</span>
                  )}
                </div>
                <button
                  className={`settings-toggle__switch ${form.use_mangohud ? 'settings-toggle__switch--on' : ''}`}
                  onClick={() => handleChange('use_mangohud', !form.use_mangohud)}
                />
              </div>

              <div className="settings-toggle">
                <div className="settings-toggle__info">
                  <span className="settings-toggle__name">
                    Canonical Hole (skip_volatile_check)
                    <span className="settings-toggle__experimental">Experimental</span>
                  </span>
                  <span className="settings-toggle__desc">
                    WINE_CANONICAL_HOLE=skip_volatile_check — may improve performance up to 200% (DWProton)
                  </span>
                </div>
                <button
                  className={`settings-toggle__switch ${form.use_canonical_hole ? 'settings-toggle__switch--on' : ''}`}
                  onClick={() => handleChange('use_canonical_hole', !form.use_canonical_hole)}
                />
              </div>

              <div className="settings-modal__section">
                <span className="settings-modal__label">Launch arguments</span>
                <input
                  value={form.custom_launch_args}
                  onChange={(e) => handleChange('custom_launch_args', e.target.value)}
                  placeholder="e.g. -windowed -fullscreen"
                  spellCheck={false}
                />
              </div>

              <div className="settings-modal__section">
                <span className="settings-modal__label">Custom environment variables</span>
                <textarea
                  className="settings-textarea"
                  value={form.custom_env_vars}
                  onChange={(e) => handleChange('custom_env_vars', e.target.value)}
                  placeholder={"# One per line, KEY=VALUE\nDXVK_HUD=fps\nMESA_SHADER_CACHE=1"}
                  spellCheck={false}
                />
                <span className="settings-modal__hint">
                  Lines starting with # are ignored
                </span>
              </div>
            </>
          )}

          {activeTab === 'downloads' && (
            <>
              <div className="settings-modal__section">
                <span className="settings-modal__label">Max concurrent downloads</span>
                <select
                  className="settings-proton__select"
                  value={form.download_max_concurrent || 4}
                  onChange={(e) => handleChange('download_max_concurrent', parseInt(e.target.value, 10))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="settings-modal__section">
                <span className="settings-modal__label">Speed limit</span>
                <div className="settings-speed-limit">
                  <input
                    type="number"
                    className="settings-speed-limit__input"
                    min="0"
                    value={
                      form.download_speed_limit === 0
                        ? ''
                        : speedUnit === 'MB/s'
                          ? Math.round(form.download_speed_limit / (1024 * 1024))
                          : Math.round(form.download_speed_limit / 1024)
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      const bytes = speedUnit === 'MB/s' ? val * 1024 * 1024 : val * 1024;
                      handleChange('download_speed_limit', bytes);
                    }}
                    placeholder="0"
                  />
                  <select
                    className="settings-speed-limit__unit"
                    value={speedUnit}
                    onChange={(e) => {
                      const newUnit = e.target.value;
                      const oldUnit = speedUnit;
                      setSpeedUnit(newUnit);
                      if (form.download_speed_limit > 0) {
                        let val;
                        if (oldUnit === 'MB/s' && newUnit === 'KB/s') {
                          val = Math.round(form.download_speed_limit / 1024) * 1024;
                        } else if (oldUnit === 'KB/s' && newUnit === 'MB/s') {
                          val = Math.round(form.download_speed_limit / (1024 * 1024)) * 1024 * 1024;
                        } else {
                          val = form.download_speed_limit;
                        }
                        handleChange('download_speed_limit', val);
                      }
                    }}
                  >
                    <option value="MB/s">MB/s</option>
                    <option value="KB/s">KB/s</option>
                  </select>
                </div>
                <span className="settings-modal__hint">0 or empty = unlimited</span>
              </div>
            </>
          )}
        </div>

        <div className="settings-modal__footer">
          <button className="settings-modal__btn settings-modal__btn--cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="settings-modal__btn settings-modal__btn--save" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
