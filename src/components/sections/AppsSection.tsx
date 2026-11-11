import React from 'react';
import { useToast } from '../common/Toast';
import { Download } from 'lucide-react';

interface AppItem {
  id: string;
  name: string;
  description: string;
  downloadUrl: string;
  filename: string;
  iconPath: string;
}

export const AppsSection: React.FC = () => {
  const { toast } = useToast();

  const handleDownload = (app: AppItem) => {
    try {
      const link = document.createElement('a');
      link.href = app.downloadUrl;
      link.setAttribute('download', app.filename);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        type: 'success',
        title: `Download Initialised`,
        description: `Downloading ${app.name}. The installation package is being saved to your computer.`
      });
    } catch {
      window.location.href = app.downloadUrl;
    }
  };

  const APPS_LIST: AppItem[] = [
    {
      id: 'tor',
      name: 'Tor Browser',
      description: 'Privacy-focused browser routing traffic through encrypted nodes to preserve anonymity.',
      downloadUrl: 'https://www.torproject.org/dist/torbrowser/14.0.7/tor-browser-windows-x86_64-portable-14.0.7.exe',
      filename: 'tor-browser-portable.exe',
      iconPath: '/app-icons/tor.png'
    },
    {
      id: 'brave',
      name: 'Brave',
      description: 'High-speed, private browser with native ad blocking and advanced tracker shielding.',
      downloadUrl: 'https://laptop-updates.brave.com/latest/winx64',
      filename: 'BraveBrowserSetup.exe',
      iconPath: '/app-icons/brave.png'
    },
    {
      id: 'epic-privacy',
      name: 'Epic Privacy',
      description: 'Private browser featuring an encrypted proxy and automated data tracker prevention.',
      downloadUrl: 'https://cdn.epicbrowser.com/epic_setup.exe',
      filename: 'epic_setup.exe',
      iconPath: '/app-icons/epic.png'
    },
    {
      id: 'ungoogled-chromium',
      name: 'Ungoogled Chromium',
      description: 'Clean Chromium build stripped of Google background telemetry and background bloat.',
      downloadUrl: 'https://github.com/ungoogled-software/ungoogled-chromium-windows/releases/download/134.0.6998.35-1.1/ungoogled-chromium_134.0.6998.35-1.1_windows_x64.zip',
      filename: 'ungoogled-chromium_windows_x64.zip',
      iconPath: '/app-icons/chromium.png'
    },
    {
      id: 'librewolf',
      name: 'LibreWolf',
      description: 'Security-hardened browser engineered to neutralise online fingerprinting and telemetry.',
      downloadUrl: 'https://gitlab.com/api/v4/projects/44042130/packages/generic/librewolf/latest/librewolf-latest-windows-x86_64-setup.exe',
      filename: 'librewolf-setup.exe',
      iconPath: '/app-icons/librewolf.png'
    },
    {
      id: 'waterfox',
      name: 'Waterfox',
      description: 'Fast, customisable Firefox alternative built for 64-bit performance and reduced overhead.',
      downloadUrl: 'https://cdn1.waterfox.net/waterfox/releases/latest/windows/Waterfox%20Setup.exe',
      filename: 'Waterfox-Setup.exe',
      iconPath: '/app-icons/waterfox.png'
    },
    {
      id: 'google-chrome',
      name: 'Google Chrome',
      description: 'Reliable, rapid standard browser with native Google ecosystem synchronisation.',
      downloadUrl: 'https://dl.google.com/chrome/install/standalone/ChromeSetup.exe',
      filename: 'ChromeSetup.exe',
      iconPath: '/app-icons/chrome.png'
    },
    {
      id: 'opera-gx',
      name: 'Opera GX',
      description: 'Gaming-orientated browser with hardware CPU/RAM limiters and dedicated customisation.',
      downloadUrl: 'https://net.geo.opera.com/opera_gx/installer',
      filename: 'OperaGXSetup.exe',
      iconPath: '/app-icons/opera-gx.png'
    }
  ];

  return (
    <section className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Clean section header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
          Downloads
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-normal">
          Curated browsers recommended for heightened privacy and streamlined navigation.
        </p>
      </div>

      {/* Clean, minimalist app list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {APPS_LIST.map((app) => (
          <div
            key={app.id}
            className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-150 gap-4"
          >
            {/* Left: App Logo + Info */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-center p-1.5 shrink-0 select-none shadow-sm">
                <img
                  src={app.iconPath}
                  alt={app.name}
                  className="w-full h-full object-contain select-none"
                  loading="lazy"
                />
              </div>

              <div className="flex flex-col min-w-0">
                <h3 className="text-white font-semibold text-sm tracking-tight truncate">
                  {app.name}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-1 mt-0.5">
                  {app.description}
                </p>
              </div>
            </div>

            {/* Right: Direct Download Button */}
            <button
              onClick={() => handleDownload(app)}
              className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-800 text-white font-medium text-xs transition-colors cursor-pointer border border-zinc-700/60 focus-visible:outline-none"
            >
              <Download className="w-3.5 h-3.5 text-zinc-300" />
              <span>Download</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
