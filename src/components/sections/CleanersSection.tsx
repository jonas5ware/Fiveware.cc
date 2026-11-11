import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useToast } from '../common/Toast';
import { 
  CheckCircle2, 
  X, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Loader2,
  Play,
  RotateCcw,
  XCircle,
  Clock,
  Lock,
  AlertCircle
} from 'lucide-react';

export interface CleanerItem {
  id: string;
  title: string;
  description: string;
  buttonText: 'Clean' | 'Enable' | 'Limpar' | 'Ativar';
  category: 'cleaner' | 'system' | 'network' | 'app';
  icon: React.ReactNode;
  nativeCommand?: string;
  actionDetails: {
    steps: string[];
    scriptContent?: string;
    scriptFileName?: string;
    modalTitle: string;
    modalDescription: string;
  };
}

export const CLEANERS: CleanerItem[] = [
  {
    id: 'limpar-temporarios',
    title: 'Clean Temporary Files',
    description:
      'Purges system and application temporary files, reclaiming disk space, reducing input lag and accelerating overall Windows responsiveness.',
    buttonText: 'Clean',
    category: 'cleaner',
    nativeCommand: 'del /q/f/s "%TEMP%\\*" & del /q/f/s "C:\\Windows\\Temp\\*"',
    actionDetails: {
      modalTitle: 'Temporary Files Cleanup (%TEMP%)',
      modalDescription:
        'Purges residual temporary files accumulated by background processes, web browsers and installers occupying disk space on your drive.',
      steps: [
        'Scan %LOCALAPPDATA%\\Temp directory',
        'Scan system cache C:\\Windows\\Temp',
        'Remove setup leftovers and crash dumps safely',
        'Reclaim disk space and minimise fragmentation'
      ],
      scriptFileName: 'Fiveware_Clean_Temp.bat',
      scriptContent: `@echo off
echo ===================================================
echo [Fiveware.cc] Cleaning Windows Temporary Files
echo ===================================================
echo.
echo Cleaning %%TEMP%%...
del /s /f /q "%TEMP%\\*.*" >nul 2>&1
for /d %%p in ("%TEMP%\\*.*") do rmdir "%%p" /s /q >nul 2>&1
echo Cleaning C:\\Windows\\Temp...
del /s /f /q "C:\\Windows\\Temp\\*.*" >nul 2>&1
for /d %%p in ("C:\\Windows\\Temp\\*.*") do rmdir "%%p" /s /q >nul 2>&1
echo.
echo Completed successfully!
pause`
    },
    icon: (
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center select-none relative">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-md">
          {/* Sponge / Foam */}
          <path
            d="M18 26C18 21.5 22.5 18 28 18C30.5 18 32.8 19 34.5 20.6C36 19 38.5 18 41 18C46 18 50 21.5 50 26C50 27.5 49.5 28.8 48.7 30H19.3C18.5 28.8 18 27.5 18 26Z"
            fill="#60A5FA"
          />
          {/* Foam bubbles */}
          <circle cx="16" cy="18" r="2.5" fill="#93C5FD" />
          <circle cx="21" cy="12" r="3" fill="#BAE6FD" />
          <circle cx="13" cy="24" r="1.5" fill="#BFDBFE" />
          <circle cx="49" cy="14" r="2" fill="#BAE6FD" />
          {/* Bucket Body */}
          <path
            d="M17 28L21 54C21.4 56.2 23.3 58 25.5 58H42.5C44.7 58 46.6 56.2 47 54L51 28H17Z"
            fill="url(#bucketGradient)"
          />
          {/* Bucket Handle Arch */}
          <path
            d="M15 30C15 15 49 15 49 30"
            stroke="#D4D4D8"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Broom Bristles */}
          <path
            d="M48 38L57 55C58 57 56 59 53 59L45 56L48 38Z"
            fill="#FBBF24"
          />
          {/* Broom handle */}
          <rect
            x="53"
            y="16"
            width="3.5"
            height="28"
            rx="1.5"
            transform="rotate(24 53 16)"
            fill="#D97706"
          />
          <defs>
            <linearGradient id="bucketGradient" x1="17" y1="28" x2="49" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A855F7" />
              <stop offset="1" stopColor="#7E22CE" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    )
  },
  {
    id: 'limpar-prefetch',
    title: 'Clean Prefetch',
    description:
      'Purging the Prefetch cache removes stale application launch records, improving system responsiveness and speeding up boot and execution times.',
    buttonText: 'Clean',
    category: 'cleaner',
    nativeCommand: 'del /q/f/s "C:\\Windows\\Prefetch\\*"',
    actionDetails: {
      modalTitle: 'Windows Prefetch Cache Cleanup',
      modalDescription:
        'The Prefetch directory stores launch indexing for applications. Over time, uninstalled programmes leave orphan files that can degrade disk access times.',
      steps: [
        'Inspect Windows registry prefetch configuration',
        'Locate system directory C:\\Windows\\Prefetch',
        'Safely purge obsolete launch indexing (.pf files)',
        'Allow Windows to generate fresh indices for current apps'
      ],
      scriptFileName: 'Fiveware_Clean_Prefetch.bat',
      scriptContent: `@echo off
echo ===================================================
echo [Fiveware.cc] Cleaning Windows Prefetch Cache
echo ===================================================
echo.
echo Requires Administrator privileges...
del /s /f /q "C:\\Windows\\Prefetch\\*.*" >nul 2>&1
echo.
echo Prefetch cache purged successfully!
pause`
    },
    icon: (
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center select-none relative">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-md">
          {/* Sparkles / Magic dust */}
          <circle cx="20" cy="16" r="2.5" fill="#38BDF8" />
          <circle cx="23" cy="24" r="1.8" fill="#7DD3FC" />
          <circle cx="15" cy="27" r="1.2" fill="#BAE6FD" />
          {/* Broom Stick */}
          <path
            d="M50 12L34 36"
            stroke="#2563EB"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Broom connector */}
          <path
            d="M36 33L31 40L38 43L43 36L36 33Z"
            fill="#1D4ED8"
          />
          {/* Broom Brush head */}
          <path
            d="M33 38C33 38 22 44 18 52C16 56 19 59 23 58C30 57 41 49 41 43L33 38Z"
            fill="#F59E0B"
          />
          {/* Sweeping lines */}
          <path
            d="M23 58C28 55 35 48 37 42"
            stroke="#D97706"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    )
  },
  {
    id: 'limpar-lixeira',
    title: 'Empty Recycle Bin',
    description:
      'Permanently purges all items residing in the Recycle Bin across all disk drives, immediately freeing up gigabytes of storage space.',
    buttonText: 'Clean',
    category: 'cleaner',
    nativeCommand: 'PowerShell.exe -NoProfile -Command "Clear-RecycleBin -Confirm:$false"',
    actionDetails: {
      modalTitle: 'Empty Windows Recycle Bin',
      modalDescription:
        'Permanently deletes all discarded files stored in the recycle bin across all partition volumes (C:, D:, etc.), reclaiming storage instantly.',
      steps: [
        'Verify mounted local drives in the operating system',
        'Locate hidden system $Recycle.Bin directories',
        'Execute quiet unprompted purge routine without file locks',
        'Reclaim storage clusters across physical drives'
      ],
      scriptFileName: 'Fiveware_Empty_RecycleBin.bat',
      scriptContent: `@echo off
echo ===================================================
echo [Fiveware.cc] Emptying Windows Recycle Bin
echo ===================================================
PowerShell.exe -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"
echo Recycle bin emptied successfully!
pause`
    },
    icon: (
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center select-none relative">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-md">
          {/* Recycle Bin Top Cover / Lid */}
          <path
            d="M17 18C17 16.5 18.5 15 20.5 15H43.5C45.5 15 47 16.5 47 18V21H17V18Z"
            fill="#22C55E"
          />
          {/* Handle on lid */}
          <path
            d="M27 15V13C27 12 28 11 29 11H35C36 11 37 12 37 13V15"
            stroke="#15803D"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Bin Body */}
          <path
            d="M20 22L23 54C23.2 56 25 58 27.5 58H36.5C39 58 40.8 56 41 54L44 22H20Z"
            fill="#16A34A"
          />
          {/* Front vertical ridges */}
          <path d="M26 26L28 52" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
          <path d="M32 26L32 52" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 26L36 52" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
          {/* Bottom wheel */}
          <circle cx="43" cy="56" r="3.5" fill="#71717A" />
          <circle cx="43" cy="56" r="1.5" fill="#E4E4E7" />
        </svg>
      </div>
    )
  },
  {
    id: 'limpar-recentes',
    title: 'Clear Recent History',
    description:
      'Clears Quick Access and recent documents history, eliminating clutter and preserving system confidentiality.',
    buttonText: 'Clean',
    category: 'cleaner',
    nativeCommand: 'del /q/f/s "%APPDATA%\\Microsoft\\Windows\\Recent\\*"',
    actionDetails: {
      modalTitle: 'Recent Files & Quick Access Cleanup',
      modalDescription:
        'Removes shortcuts and tracking logs of recently accessed documents maintained by Windows Explorer, safeguarding privacy.',
      steps: [
        'Access %APPDATA%\\Microsoft\\Windows\\Recent directory',
        'Purge taskbar jump-list shortcuts (AutomaticDestinations)',
        'Clear Windows Explorer search history cache',
        'Reset Quick Access index while keeping pinned favourites'
      ],
      scriptFileName: 'Fiveware_Clean_Recent.bat',
      scriptContent: `@echo off
echo ===================================================
echo [Fiveware.cc] Clearing Windows Recent Documents
echo ===================================================
del /s /f /q "%APPDATA%\\Microsoft\\Windows\\Recent\\*.*" >nul 2>&1
del /s /f /q "%APPDATA%\\Microsoft\\Windows\\Recent\\AutomaticDestinations\\*.*" >nul 2>&1
del /s /f /q "%APPDATA%\\Microsoft\\Windows\\Recent\\CustomDestinations\\*.*" >nul 2>&1
echo Recent history cleared successfully!
pause`
    },
    icon: (
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center select-none relative">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-md">
          {/* File paper body */}
          <path
            d="M18 14C18 11.8 19.8 10 22 10H38L48 20V52C48 54.2 46.2 56 44 56H22C19.8 56 18 54.2 18 52V14Z"
            fill="#38BDF8"
          />
          {/* Folded paper corner */}
          <path
            d="M38 10V18C38 19 39 20 40 20H48L38 10Z"
            fill="#0284C7"
          />
          {/* Magnifying Glass */}
          <circle
            cx="38"
            cy="40"
            r="10"
            stroke="#0284C7"
            strokeWidth="4"
            fill="#E0F2FE"
          />
          <path
            d="M45 47L55 57"
            stroke="#0369A1"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    )
  },
  {
    id: 'limpar-dns',
    title: 'Flush DNS Cache',
    description:
      'Resolves connectivity hitches, stabilises online latency, clears corrupted resolver cache and accelerates domain resolution for gaming and browsing.',
    buttonText: 'Clean',
    category: 'network',
    nativeCommand: 'ipconfig /flushdns',
    actionDetails: {
      modalTitle: 'Flush & Renew DNS Resolver Cache',
      modalDescription:
        'Executes Windows ipconfig /flushdns to clear stale DNS mappings, mitigating 404 errors, packet drop and ping spikes in online servers.',
      steps: [
        'Query Windows DNS Client service',
        'Flush TCP/IP resolver cache tables',
        'Renew server queries for active connection',
        'Eliminate network delay caused by obsolete IP routing'
      ],
      scriptFileName: 'Fiveware_Flush_DNS.bat',
      scriptContent: `@echo off
echo ===================================================
echo [Fiveware.cc] Flushing Windows DNS Cache
echo ===================================================
ipconfig /flushdns
echo.
echo DNS resolver cache purged successfully!
pause`
    },
    icon: (
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center select-none relative">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-md">
          {/* Globe Circle */}
          <circle cx="32" cy="32" r="24" fill="#0284C7" />
          {/* Latitude & Longitude lines */}
          <ellipse cx="32" cy="32" rx="14" ry="24" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
          <line x1="8" y1="32" x2="56" y2="32" stroke="#38BDF8" strokeWidth="2.5" />
          <line x1="12" y1="20" x2="52" y2="20" stroke="#38BDF8" strokeWidth="2" />
          <line x1="12" y1="44" x2="52" y2="44" stroke="#38BDF8" strokeWidth="2" />
          {/* Badge Pill with text DNS */}
          <rect x="13" y="24" width="38" height="16" rx="4" fill="#0369A1" stroke="#BAE6FD" strokeWidth="1.5" />
          <text
            x="32"
            y="36"
            fill="#FFFFFF"
            fontSize="12"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
            letterSpacing="1"
          >
            DNS
          </text>
        </svg>
      </div>
    )
  },
  {
    id: 'ativar-windows',
    title: 'Windows Activation',
    description:
      'Access native digital licensing verification and validation diagnostics for Windows 10 Pro, Home, Windows 11 Pro and Home.',
    buttonText: 'Enable',
    category: 'system',
    nativeCommand: 'slmgr /xpr',
    actionDetails: {
      modalTitle: 'Windows Licensing & Activation Panel',
      modalDescription:
        'Access the native Windows panel to verify digital license status or validate an official product key without third-party hazards.',
      steps: [
        'Verify operating system build and edition (Home or Pro)',
        'Query digital license status via Software Licensing (slmgr)',
        'Open official Windows Activation settings panel (ms-settings:activation)',
        'Bind digital license with official Microsoft support'
      ],
      scriptFileName: 'Fiveware_Verify_Activation.bat',
      scriptContent: `@echo off
echo ===================================================
echo [Fiveware.cc] Windows Activation Dashboard
echo ===================================================
echo Opening Activation Settings...
start ms-settings:activation
echo.
echo Querying license validity...
slmgr /xpr
echo Completed!
pause`
    },
    icon: (
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center select-none relative">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-md">
          {/* Golden Key floating above hand */}
          <circle cx="44" cy="22" r="5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2.5" />
          <path
            d="M41 25L32 34L35 37L31 41"
            stroke="#F59E0B"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Hand offering / holding */}
          <path
            d="M12 43C12 43 18 40 24 40C29 40 33 43 38 43C42 43 49 39 52 42C54 44 52 48 48 50C43 52 38 52 32 54C26 56 20 57 14 55C12 54 11 50 12 43Z"
            fill="#F97316"
          />
          <path
            d="M12 43L18 36C20 34 23 35 25 38L27 41"
            stroke="#EA580C"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    )
  },
  {
    id: 'visualizador-antigo',
    title: 'Legacy Photo Viewer',
    description:
      'Restore the classic lightweight Windows 7 Photo Viewer for instant photo loading with virtually zero resource consumption.',
    buttonText: 'Enable',
    category: 'system',
    nativeCommand: 'reg add "HKCU\\Software\\Classes\\Applications\\photoviewer.dll" /f',
    actionDetails: {
      modalTitle: 'Enable Classic Windows 7 Photo Viewer',
      modalDescription:
        'The classic Photo Viewer (PhotoViewer.dll) launches instantaneously without modern UWP delays, favoured by gamers and editors for its speed.',
      steps: [
        'Enable image file association registry keys',
        'Create command handlers for .jpg, .png, .jpeg and .bmp',
        'Restore lightweight native PhotoViewer.dll executable',
        'Register as default application in Open With menu'
      ],
      scriptFileName: 'Fiveware_Enable_PhotoViewer.reg',
      scriptContent: `Windows Registry Editor Version 5.00

; [Fiveware.cc] Habilitar Visualizador de Fotos Antigo do Windows 7 no Windows 10/11
[HKEY_CURRENT_USER\\Software\\Classes\\Applications\\photoviewer.dll\\shell\\open]
"MuiVerb"="@photoviewer.dll,-3043"

[HKEY_CURRENT_USER\\Software\\Classes\\Applications\\photoviewer.dll\\shell\\open\\command]
@=hex(2):25,00,53,00,79,00,73,00,74,00,65,00,6d,00,52,00,6f,00,6f,00,74,00,25,\\
  00,5c,00,53,00,79,00,73,00,74,00,65,00,6d,00,33,00,32,00,5c,00,72,00,75,00,\\
  6e,00,64,00,6c,00,6c,00,33,00,32,00,2e,00,65,00,78,00,65,00,20,00,22,00,25,\\
  00,50,00,72,00,6f,00,67,00,72,00,61,00,6d,00,46,00,69,00,6c,00,65,00,73,00,\\
  25,00,5c,00,57,00,69,00,6e,00,64,00,6f,00,77,00,73,00,20,00,50,00,68,00,6f,\\
  00,74,00,6f,00,20,00,56,00,69,00,65,00,77,00,65,00,72,00,5c,00,50,00,68,00,\\
  6f,00,74,00,6f,00,56,00,69,00,65,00,77,00,65,00,72,00,2e,00,64,00,6c,00,6c,\\
  00,22,00,2c,00,20,00,49,00,6d,00,61,00,67,00,65,00,56,00,69,00,65,00,77,00,\\
  5f,00,46,00,75,00,6c,00,6c,00,73,00,63,00,72,00,65,00,65,00,6e,00,20,00,25,\\
  00,31,00,00,00`
    },
    icon: (
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center select-none relative">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-md">
          {/* Photo Frame / Canvas Background */}
          <rect x="14" y="14" width="36" height="36" rx="6" fill="#F59E0B" />
          {/* Sun */}
          <circle cx="24" cy="24" r="3.5" fill="#FEF08A" />
          {/* Mountains */}
          <path
            d="M14 42L24 29L32 37L39 30L50 42V44C50 47.3 47.3 50 44 50H20C16.7 50 14 47.3 14 44V42Z"
            fill="#D97706"
          />
          {/* Back card layer with blue tone */}
          <path
            d="M48 20L52 24V46C52 48 50 50 48 50H32"
            stroke="#38BDF8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    )
  },
  {
    id: 'limpar-cache-discord',
    title: 'Clear Discord Cache',
    description:
      'Completely purges Discord media, stickers, and cached assets, resolving sluggish startup and voice connection hiccups.',
    buttonText: 'Clean',
    category: 'app',
    nativeCommand: 'del /q/f/s "%APPDATA%\\discord\\Cache\\*"',
    actionDetails: {
      modalTitle: 'Discord Application Cache Cleanup',
      modalDescription:
        'Discord retains hundreds of megabytes in cached media. Purging it resolves voice connection failures and sluggish interface rendering.',
      steps: [
        'Terminate suspended Discord background instances',
        'Locate %APPDATA%\\discord\\Cache and Code Cache directories',
        'Purge outdated media and cached video fragments',
        'Reduce Discord active RAM consumption'
      ],
      scriptFileName: 'Fiveware_Clean_Discord.bat',
      scriptContent: `@echo off
echo ===================================================
echo [Fiveware.cc] Purging Discord Cache
echo ===================================================
echo Closing Discord if running...
taskkill /F /IM Discord.exe >nul 2>&1
timeout /t 1 /nobreak >nul
echo Purging cache directories...
del /s /f /q "%APPDATA%\\discord\\Cache\\*.*" >nul 2>&1
del /s /f /q "%APPDATA%\\discord\\Code Cache\\*.*" >nul 2>&1
del /s /f /q "%APPDATA%\\discord\\GPUCache\\*.*" >nul 2>&1
echo Discord cache cleared successfully!
pause`
    },
    icon: (
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center select-none relative">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-md">
          {/* Discord rounded mascot shape */}
          <path
            d="M49 19C45.5 17.5 42 16.5 38 16C37.5 17 37 18 36.5 19C32.5 18.5 28.5 18.5 24.5 19C24 18 23.5 17 23 16C19 16.5 15.5 17.5 12 19C6 28 4.5 37 5 45.5C9 48.5 13 50.5 17 52C18 50.5 19 49 20 47.5C18.5 47 17 46 16 45C16.5 44.5 17 44 17.5 43.5C25 47 36 47 43.5 43.5C44 44 44.5 44.5 45 45C44 46 42.5 47 41 47.5C42 49 43 50.5 44 52C48 50.5 52 48.5 56 45.5C56.5 36 53.5 27 49 19Z"
            fill="#5865F2"
          />
          {/* Eyes */}
          <ellipse cx="23" cy="34" rx="4" ry="4.5" fill="#FFFFFF" />
          <ellipse cx="38" cy="34" rx="4" ry="4.5" fill="#FFFFFF" />
          <circle cx="23" cy="34" r="2" fill="#5865F2" />
          <circle cx="38" cy="34" r="2" fill="#5865F2" />
        </svg>
      </div>
    )
  }
];

export const CleanersSection: React.FC = () => {
  const { toast } = useToast();
  const [activeItem, setActiveItem] = useState<CleanerItem | null>(null);
  const [isRunningAction, setIsRunningAction] = useState(false);
  const [actionFinished, setActionFinished] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Sequential 'Cleanup All' state
  const [isCleaningAll, setIsCleaningAll] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskStatuses, setTaskStatuses] = useState<Record<string, 'idle' | 'running' | 'completed'>>({});
  const [completedCount, setCompletedCount] = useState(0);
  const cancelRequestedRef = useRef(false);

  // All available cleanup tasks (tasks where buttonText is 'Clean' or 'Limpar')
  const cleanupTasks = CLEANERS.filter((item) => item.buttonText === 'Clean' || item.buttonText === 'Limpar');
  const allCompleted = cleanupTasks.length > 0 && cleanupTasks.every((t) => taskStatuses[t.id] === 'completed');

  // Cancel cleanup if component unmounts
  useEffect(() => {
    return () => {
      cancelRequestedRef.current = true;
    };
  }, []);

  // Administrative password modal state for 'Enable' / 'Ativar' actions
  const [passwordModalItem, setPasswordModalItem] = useState<CleanerItem | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleActionClick = (item: CleanerItem) => {
    if (isCleaningAll) return;
    setActiveItem(item);
    setIsRunningAction(true);
    setActionFinished(false);
    setCopiedCmd(false);

    setTaskStatuses((prev) => ({ ...prev, [item.id]: 'running' }));

    // Simulate standard cleaning/activation verification flow
    setTimeout(() => {
      setIsRunningAction(false);
      setActionFinished(true);
      setTaskStatuses((prev) => ({ ...prev, [item.id]: 'completed' }));
      toast({
        type: 'success',
        title: item.buttonText === 'Clean' || item.buttonText === 'Limpar' ? 'Routine Completed' : 'Module Activated',
        description: `${item.title} executed successfully.`
      });
    }, 1200);
  };

  const handleCardButtonClick = (item: CleanerItem) => {
    if (isCleaningAll) return;

    // When the user clicks 'Enable' / 'Ativar', request secret admin password (048)
    if (item.buttonText === 'Enable' || item.buttonText === 'Ativar') {
      setPasswordModalItem(item);
      setAdminPasswordInput('');
      setPasswordError('');
      return;
    }

    handleActionClick(item);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // The administrative password is strictly 048; no other input works
    if (adminPasswordInput.trim() === '048') {
      const targetItem = passwordModalItem;
      setPasswordModalItem(null);
      setAdminPasswordInput('');
      setPasswordError('');

      toast({
        type: 'success',
        title: 'Administrative Access Approved',
        description: 'Administrative security key successfully authenticated.'
      });

      if (targetItem) {
        handleActionClick(targetItem);
      }
    } else {
      setPasswordError('Incorrect password. Access restricted to authorised staff.');
      toast({
        type: 'error',
        title: 'Access Denied',
        description: 'Invalid administrative security credentials.'
      });
    }
  };

  const closePasswordModal = () => {
    setPasswordModalItem(null);
    setAdminPasswordInput('');
    setPasswordError('');
  };

  const handleCleanupAll = async () => {
    if (isCleaningAll) return;

    setIsCleaningAll(true);
    cancelRequestedRef.current = false;
    setCompletedCount(0);

    // Reset status of all cleanup tasks to idle before starting
    const initialStatuses: Record<string, 'idle' | 'running' | 'completed'> = { ...taskStatuses };
    cleanupTasks.forEach((t) => {
      initialStatuses[t.id] = 'idle';
    });
    setTaskStatuses(initialStatuses);

    toast({
      type: 'info',
      title: 'Cleanup All Initialised',
      description: `Executing ${cleanupTasks.length} cleanup routines sequentially...`
    });

    let finishedTasks = 0;

    for (let i = 0; i < cleanupTasks.length; i++) {
      if (cancelRequestedRef.current) break;

      const task = cleanupTasks[i];
      setCurrentTaskId(task.id);

      // Set current task as running
      setTaskStatuses((prev) => ({ ...prev, [task.id]: 'running' }));

      // Simulate sequential task processing
      await new Promise((resolve) => setTimeout(resolve, 750));

      if (cancelRequestedRef.current) break;

      // Mark task as completed
      setTaskStatuses((prev) => ({ ...prev, [task.id]: 'completed' }));
      finishedTasks += 1;
      setCompletedCount(finishedTasks);

      toast({
        type: 'success',
        title: `${task.title}`,
        description: `(${finishedTasks}/${cleanupTasks.length}) Routine executed successfully.`
      });
    }

    if (!cancelRequestedRef.current) {
      setIsCleaningAll(false);
      setCurrentTaskId(null);

      toast({
        type: 'success',
        title: 'Cleanup All Completed!',
        description: `All ${cleanupTasks.length} system cleanup routines finished successfully.`
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe fallback
      }
    } else {
      setIsCleaningAll(false);
      setCurrentTaskId(null);
      toast({
        type: 'info',
        title: 'Cleanup All Cancelled',
        description: 'Sequential execution was stopped by user request.'
      });
    }
  };

  const handleCancelCleanupAll = () => {
    cancelRequestedRef.current = true;
    setIsCleaningAll(false);
    setCurrentTaskId(null);
  };

  const handleResetStatuses = () => {
    setTaskStatuses({});
    setCompletedCount(0);
    toast({
      type: 'info',
      title: 'Status Reset',
      description: 'Cleanup routines ready for execution.'
    });
  };

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCmd(true);
    toast({
      type: 'info',
      title: 'Command Copied',
      description: 'Command copied to clipboard.'
    });
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDownloadScript = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      type: 'success',
      title: 'Script Downloaded',
      description: `Script "${fileName}" downloaded successfully.`
    });
  };

  const currentTaskRunning = cleanupTasks.find((t) => t.id === currentTaskId);
  const progressPercent = cleanupTasks.length > 0 
    ? Math.round((completedCount / cleanupTasks.length) * 100) 
    : 0;

  return (
    <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header section with neutral, clean styling */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
          Optimisers &amp; Cleaners
        </h2>
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 mt-2 font-mono">
          <span>System Maintenance</span>
          <span aria-hidden="true">·</span>
          <span>Secure Deletion</span>
          <span aria-hidden="true">·</span>
          <span>Zero Bloat</span>
        </div>
      </div>

      {/* Control Banner with Cleanup All button & Live Progress */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#141417] border border-zinc-800/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sky-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm sm:text-base font-display">
                  Automated Cleanup Routine
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                  {cleanupTasks.length} Tasks
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Execute all system cleanup routines sequentially with a single click.
              </p>
            </div>
          </div>

          {/* Action Buttons: Cleanup All, Cancel, Reset */}
          <div className="flex items-center gap-2 shrink-0">
            {isCleaningAll && (
              <button
                onClick={handleCancelCleanupAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer border border-zinc-700/60"
                title="Stop sequential execution"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Cancel</span>
              </button>
            )}

            {allCompleted && !isCleaningAll && (
              <button
                onClick={handleResetStatuses}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-medium transition-colors cursor-pointer border border-zinc-700/50"
                title="Reset completion statuses"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={handleCleanupAll}
              disabled={isCleaningAll}
              data-testid="cleanup-all-button"
              aria-label="Cleanup All"
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm tracking-wide transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
                isCleaningAll
                  ? 'bg-zinc-800 text-zinc-300 cursor-wait opacity-90 border border-zinc-700'
                  : allCompleted
                  ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700'
                  : 'bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-850 text-white border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {isCleaningAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Cleanup All ({completedCount}/{cleanupTasks.length})</span>
                </>
              ) : allCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>Cleanup All (Completed)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Cleanup All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Progress Bar when Cleanup All is running or completed */}
        {(isCleaningAll || allCompleted || completedCount > 0) && (
          <div className="mt-4 pt-3.5 border-t border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-300">
                {isCleaningAll ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>
                      Executing:{' '}
                      <strong className="text-white">
                        {currentTaskRunning ? currentTaskRunning.title : 'Preparing...'}
                      </strong>
                    </span>
                  </>
                ) : allCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-sky-400 font-semibold">
                      All system cleanup routines completed successfully!
                    </span>
                  </>
                ) : (
                  <span>
                    Completed: {completedCount} of {cleanupTasks.length}
                  </span>
                )}
              </div>

              <span className="text-zinc-400">
                {completedCount}/{cleanupTasks.length} ({progressPercent}%)
              </span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <motion.div
                className="h-full bg-gradient-to-r from-sky-500 to-blue-400 rounded-full"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid of Cleaners matching user's reference mockup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {CLEANERS.map((item) => {
          const status = taskStatuses[item.id] || 'idle';
          const isCurrentRunning = currentTaskId === item.id;
          const isCompleted = status === 'completed';
          const isCleanerTask = item.buttonText === 'Clean' || item.buttonText === 'Limpar';

          return (
            <div
              key={item.id}
              data-task-id={item.id}
              data-status={status}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl transition-all duration-200 card-smooth shadow-sm relative overflow-hidden ${
                isCurrentRunning
                  ? 'bg-[#181a1f] border-zinc-700'
                  : isCompleted
                  ? 'bg-[#141417] border-zinc-800/80 hover:border-zinc-700'
                  : 'bg-[#141417] hover:bg-[#18181c] border-zinc-800/80 hover:border-zinc-700'
              } border`}
            >
              {/* Active Step Indicator Pill */}
              {isCurrentRunning && (
                <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] font-mono text-sky-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Cleaning...</span>
                </div>
              )}

              {isCompleted && !isCurrentRunning && (
                <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] font-mono text-sky-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  <Check className="w-3 h-3" />
                  <span>Completed</span>
                </div>
              )}

              {isCleaningAll && status === 'idle' && isCleanerTask && (
                <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  <Clock className="w-3 h-3" />
                  <span>Queued</span>
                </div>
              )}

              {/* Left: Custom SVG Icon & Text block */}
              <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 pr-3 min-w-0">
                <div className="shrink-0">{item.icon}</div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-base sm:text-lg tracking-tight font-display">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed line-clamp-3 font-normal">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Right: Action button */}
              <div className="shrink-0 pl-1 sm:pl-2">
                <button
                  onClick={() => handleCardButtonClick(item)}
                  disabled={isCleaningAll}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm tracking-wide transition-colors cursor-pointer border shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 flex items-center gap-1.5 ${
                    isCleaningAll
                      ? 'opacity-60 cursor-not-allowed bg-zinc-800 border-zinc-700 text-zinc-400'
                      : isCompleted
                      ? 'bg-zinc-850 hover:bg-zinc-800 active:bg-zinc-900 text-sky-400 border-zinc-700/60'
                      : 'bg-[#3f3f46] hover:bg-[#52525b] active:bg-[#27272a] text-white border-zinc-600/30'
                  }`}
                >
                  {isCurrentRunning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : isCompleted ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-sky-400" />
                      <span>{item.buttonText === 'Clean' || item.buttonText === 'Limpar' ? 'Cleaned' : 'Active'}</span>
                    </>
                  ) : (
                    <span>{item.buttonText === 'Limpar' ? 'Clean' : item.buttonText === 'Ativar' ? 'Enable' : item.buttonText}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Administrative Password Modal (Strictly 048) */}
      <AnimatePresence>
        {passwordModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePasswordModal}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 6 }}
              transition={{ duration: 0.16 }}
              className="relative w-full max-w-[320px] bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl p-5 z-10 text-white"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={closePasswordModal}
                className="absolute top-3.5 right-3.5 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header with Lock Icon */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-white">
                    Administrative Key
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate max-w-[190px]">
                    {passwordModalItem.title}
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed mb-3.5">
                Enter administrative password to authorise execution of this feature.
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <div className="relative">
                    <input
                      type="password"
                      autoFocus
                      required
                      value={adminPasswordInput}
                      onChange={(e) => {
                        setAdminPasswordInput(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      placeholder="••••"
                      maxLength={12}
                      className={`w-full bg-zinc-950/90 border rounded-xl px-3 py-2.5 text-center text-lg tracking-[0.35em] font-mono text-white placeholder-zinc-600 focus:outline-none transition-colors ${
                        passwordError
                          ? 'border-rose-500 focus:border-rose-400'
                          : 'border-zinc-800 focus:border-zinc-600'
                      }`}
                    />
                  </div>

                  {passwordError && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-400 font-mono">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="flex-1 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors cursor-pointer border border-zinc-700/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] active:bg-[#14532d] text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    Authorise
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for Cleaner Execution & Native Permission/Script Options */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveItem(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg bg-[#121215] border border-zinc-800 rounded-2xl overflow-hidden z-10 shadow-2xl p-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveItem(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header with Icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 shrink-0">{activeItem.icon}</div>
                <div>
                  <h3 className="text-lg font-bold font-display text-white">
                    {activeItem.actionDetails.modalTitle}
                  </h3>
                  <span className="text-xs text-zinc-400 font-mono">
                    Fiveware.cc System Optimiser
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4">
                {activeItem.actionDetails.modalDescription}
              </p>

              {/* Processing / Finished State */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                    Execution Routine:
                  </span>
                  {isRunningAction ? (
                    <span className="text-amber-400 font-mono animate-pulse flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      In progress...
                    </span>
                  ) : (
                    <span className="text-sky-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ready
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  {activeItem.actionDetails.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-zinc-400">
                      <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Native Command Line Box */}
              {activeItem.nativeCommand && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                      Native Command (Prompt / CMD):
                    </span>
                    <button
                      onClick={() => handleCopyCommand(activeItem.nativeCommand!)}
                      className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedCmd ? (
                        <>
                          <Check className="w-3 h-3 text-sky-400" />
                          <span className="text-sky-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-xs font-mono text-zinc-200 select-all overflow-x-auto">
                    <code>{activeItem.nativeCommand}</code>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                {activeItem.id === 'ativar-windows' ? (
                  <button
                    onClick={() => {
                      // Trigger windows settings protocol if supported
                      window.location.href = 'ms-settings:activation';
                      toast({
                        type: 'info',
                        title: 'Windows Settings',
                        description: 'Opening Windows Activation Settings panel.'
                      });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors cursor-pointer border border-zinc-700/60"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Windows Activation Settings</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Execute in CMD or use script
                  </span>
                )}

                {activeItem.actionDetails.scriptFileName && activeItem.actionDetails.scriptContent && (
                  <button
                    onClick={() =>
                      handleDownloadScript(
                        activeItem.actionDetails.scriptFileName!,
                        activeItem.actionDetails.scriptContent!
                      )
                    }
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3f3f46] hover:bg-[#52525b] text-white font-medium text-xs transition-colors cursor-pointer border border-zinc-600/40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Script (.bat)</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

