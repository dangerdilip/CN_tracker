import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import './App.css';
import { 
  Globe, 
  Activity, 
  Search, 
  Trash2, 
  Layers, 
  Compass, 
  Cpu, 
  Network, 
  DownloadCloud, 
  FileText,
  MapPin,
  RefreshCw,
  Info,
  ChevronRight,
  Server,
  Zap,
  CheckCircle,
  AlertTriangle,
  Play,
  Terminal
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Custom Map Behavior component to pan/zoom map based on path or coordinates
function MapUpdater({ center, zoom, bounds, triggerFit, onFitComplete, initialCenter }) {
  const map = useMap();
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Set initial map view once
  useEffect(() => {
    if (initialCenter && !hasInitialized) {
      map.setView(initialCenter, 3);
      setHasInitialized(true);
    }
  }, [initialCenter, map, hasInitialized]);

  // Fit bounds once when triggered
  useEffect(() => {
    if (triggerFit && bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
      if (onFitComplete) onFitComplete();
    }
  }, [bounds, triggerFit, map]);

  // FIX: Handle browser window resizing and parent wrapper dimension changes
  // using ResizeObserver to ensure the Leaflet map is invalidated and pan/drag works instantly!
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        map.invalidateSize({ pan: true });
      });
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

function App() {
  // Application view state: 'landing' -> 'booting' -> 'dashboard'
  const [viewState, setViewState] = useState('landing');
  const [activeTab, setActiveTab] = useState('obs');
  const [newUrl, setNewUrl] = useState('');
  
  // App Boot Loader Sequence
  const [bootStep, setBootStep] = useState(0);
  const bootMessages = [
    'Initializing Observatory Core API...',
    'Resolving client network gateway coordinates...',
    'Testing local Express diagnostic pipelines...',
    'Caching Leaflet global dark matter tile servers...',
    'NetSight Observatory Engine ready.'
  ];

  useEffect(() => {
    if (viewState === 'booting') {
      if (bootStep < bootMessages.length) {
        const timer = setTimeout(() => {
          setBootStep(prev => prev + 1);
        }, 700);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setViewState('dashboard');
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [bootStep, viewState]);

  // Dynamic user network connection info ( Ranchi default)
  const [myIpInfo, setMyIpInfo] = useState({
    query: '49.37.66.85',
    isp: 'Reliance Jio Infocomm Limited',
    city: 'Ranchi',
    countryCode: 'IN',
    lat: 23.3441,
    lon: 85.3096
  });
  const [loadingIp, setLoadingIp] = useState(false);

  // Targets List (Fixed AWS presets to use real, pingable websites)
  const [targets, setTargets] = useState([
    { id: 1, name: 'Google DNS', url: '8.8.8.8', lat: 37.751, lng: -97.822, latency: null, history: [45, 48, 52, 43, 47, 50, 44, 49, 46, 51] },
    { id: 2, name: 'Cloudflare Edge', url: '1.1.1.1', lat: -37.813, lng: 144.963, latency: null, history: [22, 25, 21, 28, 23, 24, 20, 26, 22, 21] },
    { id: 3, name: 'Github Server', url: 'github.com', lat: 37.7749, lng: -122.4194, latency: null, history: [120, 115, 118, 122, 110, 125, 130, 121, 114, 119] },
    { id: 4, name: 'AWS Japan Suffix', url: 'yahoo.co.jp', lat: 35.6762, lng: 139.6503, latency: null, history: [] },
    { id: 5, name: 'AWS Europe Portal', url: 'spiegel.de', lat: 50.1109, lng: 8.6821, latency: null, history: [] }
  ]);

  // Keep a Ref of targets to bypass the React stale closure loop in setInterval!
  const targetsRef = useRef(targets);
  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  // Presets mapping
  const presets = {
    gaming: [
      { name: 'Steam Asia/India', url: 'sgp-1.valve.net', lat: 1.3521, lng: 103.8198 },
      { name: 'League of Legends NA', url: '104.160.131.3', lat: 34.0522, lng: -118.2437 },
      { name: 'Valorant EU', url: '162.249.79.1', lat: 52.3676, lng: 4.9041 }
    ],
    cloud: [
      { name: 'Cloudflare DNS', url: 'cloudflare.com', lat: 37.7749, lng: -122.4194 },
      { name: 'AWS Virginia Edge', url: 'amazon.com', lat: 38.0293, lng: -78.4767 },
      { name: 'Azure Ireland Node', url: 'google.ie', lat: 53.3498, lng: -6.2603 }
    ],
    social: [
      { name: 'Youtube', url: 'youtube.com', lat: 37.6283, lng: -122.427 },
      { name: 'Netflix CDN', url: 'netflix.com', lat: 37.2638, lng: -121.9754 },
      { name: 'Reddit Main', url: 'reddit.com', lat: 37.7749, lng: -122.4194 }
    ]
  };

  const [activePreset, setActivePreset] = useState(null);

  // Traceroute State
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [tracePath, setTracePath] = useState([]);
  const [tracing, setTracing] = useState(false);
  const [traceStatusMsg, setTraceStatusMsg] = useState('');
  const [tracePercent, setTracePercent] = useState(0);

  const tracePathRef = useRef(tracePath);
  useEffect(() => {
    tracePathRef.current = tracePath;
  }, [tracePath]);

  // Fallback indicator state
  const [isGeoFallback, setIsGeoFallback] = useState(false);

  // Map Fitting State to prevent zooming locks!
  const [triggerMapFit, setTriggerMapFit] = useState(false);

  // DNS Resolver State
  const [dnsDomain, setDnsDomain] = useState('');
  const [dnsResults, setDnsResults] = useState(null);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [dnsError, setDnsError] = useState(null);

  // Speed Test State
  const [speedLoading, setSpeedLoading] = useState(false);
  const [speedResult, setSpeedResult] = useState(null);
  const [speedProgress, setSpeedProgress] = useState(0);

  // System Diagnostics Report State
  const [diagnosticsLogs, setDiagnosticsLogs] = useState([]);
  const [diagnosticScore, setDiagnosticScore] = useState(100);

  // Refs for auto-scrolling
  const bootTerminalBodyRef = useRef(null);
  const hopsContainerRef = useRef(null);

  // Auto-scroll boot terminal to the bottom so the loader is never hidden
  useEffect(() => {
    if (bootTerminalBodyRef.current) {
      bootTerminalBodyRef.current.scrollTop = bootTerminalBodyRef.current.scrollHeight;
    }
  }, [bootStep]);

  // Convert vertical scrolling on the hops container to horizontal scrolling
  const handleHopsWheel = useCallback((e) => {
    if (hopsContainerRef.current) {
      // Only intercept if vertical scrolling dominates to preserve native touchpad horizontal gestures
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        hopsContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  }, []);

  const hopsRefCallback = useCallback((node) => {
    if (hopsContainerRef.current) {
      hopsContainerRef.current.removeEventListener('wheel', handleHopsWheel);
    }
    if (node) {
      node.addEventListener('wheel', handleHopsWheel, { passive: false });
    }
    hopsContainerRef.current = node;
  }, [handleHopsWheel]);

  // Auto-scroll hops container to the right as new trace path hops are discovered
  useEffect(() => {
    if (hopsContainerRef.current) {
      hopsContainerRef.current.scrollTo({
        left: hopsContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [tracePath.length]);

  // Fetch client IP details on load and set map coordinates dynamically
  const fetchMyIp = async () => {
    setLoadingIp(true);
    setIsGeoFallback(false);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/my-ip`);
      if (res.data && res.data.lat) {
        setMyIpInfo(res.data);
        if (res.data.city === 'Ranchi' && res.data.query === '49.37.66.85') {
          setIsGeoFallback(true);
        }
        addLog(`Located dynamic client node in ${res.data.city || 'Unknown'}, ${res.data.country || 'India'}. coordinates: [${res.data.lat.toFixed(4)}, ${res.data.lon.toFixed(4)}]`, 'success');
      } else {
        throw new Error('Incomplete data');
      }
    } catch (err) {
      console.error('Failed to fetch My IP info', err);
      setIsGeoFallback(true);
      addLog('Dynamic geolocation bypassed. Local Ranchi home node initialized.', 'warning');
    } finally {
      setLoadingIp(false);
    }
  };

  useEffect(() => {
    if (viewState === 'dashboard') {
      fetchMyIp();
    }
  }, [viewState]);

  // System diagnostics logs helper
  const addLog = (msg, type = 'info') => {
    setDiagnosticsLogs(prev => [
      { time: new Date().toLocaleTimeString(), msg, type },
      ...prev.slice(0, 49)
    ]);
  };

  // Measure latency to all nodes using the browser client (fetch RTT with cache-busting)
  const measureLatency = async (url) => {
    const start = performance.now();
    try {
      await fetch(`https://${url}/?_cache_bust=${start}`, { 
        mode: 'no-cors',
        method: 'HEAD',
        credentials: 'omit'
      });
      return Math.round(performance.now() - start);
    } catch (e) {
      try {
        await fetch(`https://${url}/?_cache_bust=${start}`, { mode: 'no-cors' });
        return Math.round(performance.now() - start);
      } catch (err) {
        return null;
      }
    }
  };

  // FIX: Decoupled ping cycle with race-condition checking and sequential setTimeout loop.
  // This prevents overlapping pings and discards outdated ping results if the targets are swapped
  // (e.g. by loading a preset or adding/deleting targets).
  useEffect(() => {
    if (viewState !== 'dashboard') return;

    let isMounted = true;
    let timeoutId = null;

    const runPingProbes = async () => {
      const startingTargets = targetsRef.current;
      if (startingTargets.length === 0) {
        if (isMounted) {
          timeoutId = setTimeout(runPingProbes, 6000);
        }
        return;
      }

      const updated = await Promise.all(
        startingTargets.map(async (t) => {
          const lat = await measureLatency(t.url);
          const history = t.history ? [...t.history, lat].slice(-10) : [lat];
          return { ...t, latency: lat, history };
        })
      );

      if (!isMounted) return;

      const currentTargets = targetsRef.current;
      // Only commit the ping updates if the current target list is exactly the same as when we started pinging
      if (
        currentTargets.length === startingTargets.length &&
        currentTargets.every((t, idx) => t.id === startingTargets[idx].id)
      ) {
        setTargets(updated);
      }

      timeoutId = setTimeout(runPingProbes, 6000);
    };

    runPingProbes();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [viewState]);

  // Handle Preset Loader
  const loadPreset = (category) => {
    setActivePreset(category);
    const selectedPreset = presets[category];
    const newTargets = selectedPreset.map((p, idx) => ({
      id: Date.now() + idx,
      name: p.name,
      url: p.url,
      lat: p.lat,
      lng: p.lng,
      latency: null,
      history: []
    }));
    setTargets(newTargets);
    addLog(`Loaded target profile: ${category.toUpperCase()}`, 'info');
  };

  // Handle Target Geocoding & Add Node
  const addTargetNode = async () => {
    if (!newUrl.trim()) return;
    const cleanUrl = newUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    
    // Syntactic validation check (ensure no commas, spaces, or invalid chars)
    if (/,|\s/.test(cleanUrl) || !/^[a-zA-Z0-9.-]+$/.test(cleanUrl)) {
      addLog(`Invalid monitor target: "${cleanUrl}". Hostname contains spaces or commas.`, 'error');
      alert(`" ${cleanUrl} " is not a valid hostname or IP. Please enter a valid address (no spaces or commas).`);
      return;
    }

    addLog(`Querying geocoordinates for target: ${cleanUrl}...`, 'info');
    
    let ip;
    try {
      const dnsRes = await axios.get(`${API_BASE_URL}/api/dns-resolve?domain=${cleanUrl}`);
      ip = dnsRes.data.ip;
      if (!ip) throw new Error('DNS Resolution returned empty IP');
    } catch (dnsErr) {
      console.error(dnsErr);
      addLog(`Host resolution failed for "${cleanUrl}". Domain or IP may not exist.`, 'error');
      alert(`Could not resolve host "${cleanUrl}". Please enter a valid, active IP or domain.`);
      return;
    }

    try {
      const geoRes = await axios.post(`${API_BASE_URL}/api/geo-lookup`, { ip });
      const geo = geoRes.data;

      if (geo && geo.lat) {
        const newTarget = {
          id: Date.now(),
          name: cleanUrl,
          url: cleanUrl,
          lat: geo.lat,
          lng: geo.lon,
          latency: null,
          history: []
        };
        setTargets(prev => [...prev, newTarget]);
        setNewUrl('');
        addLog(`Located ${cleanUrl} [${ip}] at [${geo.city || 'Unknown'}, ${geo.country || 'Unknown'}]`, 'success');
      } else {
        throw new Error('Geolocation lookup failed');
      }
    } catch (err) {
      console.error(err);
      addLog(`Failed geocoordinate lookup for ${cleanUrl} [${ip}]. Plotting at default location [20,0]`, 'warning');
      const newTarget = {
        id: Date.now(),
        name: cleanUrl,
        url: cleanUrl,
        lat: 20,
        lng: 0,
        latency: null,
        history: []
      };
      setTargets(prev => [...prev, newTarget]);
      setNewUrl('');
    }
  };

  // Delete Target
  const deleteTarget = (id) => {
    setTargets(targets.filter(t => t.id !== id));
  };

  // Handle Visual Streaming Traceroute via Server-Sent Events (SSE)
  const startTraceroute = (targetUrl) => {
    setTracing(true);
    setSelectedTarget(targetUrl);
    setTracePath([]);
    setTraceStatusMsg('Initializing trace...');
    setTracePercent(5);
    setTriggerMapFit(false);
    addLog(`Initiating active real-time path traceroute stream to ${targetUrl}...`, 'info');

    // Create the initial path starting directly from the dynamic User Gateway Location
    const initialPath = [
      {
        ip: myIpInfo.query,
        lat: myIpInfo.lat,
        lng: myIpInfo.lon,
        city: myIpInfo.city,
        country: myIpInfo.countryCode || 'IN',
        isp: myIpInfo.isp
      }
    ];
    setTracePath(initialPath);

    // Initialize EventSource stream
    const eventSource = new EventSource(`${API_BASE_URL}/api/trace-stream?target=${targetUrl}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'status') {
          setTraceStatusMsg(data.message);
          addLog(`[TRACER] ${data.message}`, 'info');
        } 
        else if (data.type === 'hop') {
          const progress = Math.min(95, 10 + (data.hopIndex * 8));
          setTracePercent(progress);
          setTraceStatusMsg(`Tracing relay hop ${data.hopIndex}...`);

          // Log explanation if a hop is a private/local IP address!
          if (!data.hop.lat && !data.hop.lng && !data.hop.ip.includes('*')) {
            addLog(`[TRACER] Hop ${data.hopIndex} [${data.hop.ip}] is an internal ISP routing gateway. No geographic coordinates are mapped.`, 'info');
          }

          // Only push nodes that have coordinates to draw on the map
          if (data.hop.lat && data.hop.lng) {
            setTracePath(prev => {
              // Ensure we do not add duplicate IPs consecutively
              const lastHop = prev[prev.length - 1];
              if (lastHop && lastHop.ip === data.hop.ip) return prev;
              return [...prev, data.hop];
            });
          } else {
            // Push private timeouts to the trace path list too (so they appear in the bottom drawer list)
            setTracePath(prev => [...prev, data.hop]);
          }
        } 
        else if (data.type === 'done') {
          eventSource.close();
          setTracePercent(100);
          setTraceStatusMsg('Trace resolved.');
          setTracing(false);
          setTriggerMapFit(true); // Center the map ONCE after trace finishes!
          
          // COMPOSITE HEALTH SCORE CALCULATION & LOGGER EXPLANATION
          const totalHops = data.totalHops || 12;
          const timeouts = tracePathRef.current.filter(h => h.ip && h.ip.includes('*')).length;
          
          let score = 100;
          score -= (totalHops * 1.5); // minor penalty for length of path
          score -= (timeouts * 8);     // heavy penalty for timeouts / packet drops
          
          const finalScore = Math.max(10, Math.round(score));
          setDiagnosticScore(finalScore);

          addLog(`Diagnostic mapping ended. Final Score: ${finalScore}/100. Length deductions: -${(totalHops * 1.5).toFixed(1)}. Timeout deductions: -${timeouts * 8}.`, 'success');
        }
      } catch (err) {
        console.error('Error parsing SSE event data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      eventSource.close();
      setTracing(false);
      setTraceStatusMsg('Trace stream interrupted.');
      addLog(`Traceroute streaming failed. Client lost socket connection.`, 'error');
    };
  };

  // Handle DNS Details Resolution
  const runDnsDetails = async () => {
    if (!dnsDomain.trim()) return;
    setDnsLoading(true);
    setDnsResults(null);
    setDnsError(null);
    addLog(`Resolving nameserver maps for ${dnsDomain}...`, 'info');

    try {
      const res = await axios.get(`${API_BASE_URL}/api/dns-details?domain=${dnsDomain}`);
      const hasRecords = Object.values(res.data).some(v => v && (!Array.isArray(v) || v.length > 0));
      if (!hasRecords) {
        throw new Error('No DNS records found / Domain does not exist');
      }
      setDnsResults(res.data);
      addLog(`DNS registry mapping parsed successfully.`, 'success');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'DNS resolution failed. Domain may not exist.';
      setDnsError(errMsg);
      addLog(`DNS mapping failed: ${errMsg}`, 'error');
    } finally {
      setDnsLoading(false);
    }
  };

  // Handle Real-Time Speed Test
  const runSpeedTest = async () => {
    setSpeedLoading(true);
    setSpeedResult(null);
    setSpeedProgress(0);
    addLog(`Triggering speed test payload download from Express server...`, 'info');

    const start = performance.now();
    try {
      const res = await axios.get(`${API_BASE_URL}/api/speedtest/download`, {
        responseType: 'arraybuffer',
        onDownloadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setSpeedProgress(percent);
        }
      });
      
      const durationSec = (performance.now() - start) / 1000;
      const sizeBytes = res.data.byteLength;
      const sizeMbits = (sizeBytes * 8) / (1024 * 1024);
      const speedMbps = (sizeMbits / durationSec).toFixed(2);
      
      setSpeedResult({
        speed: speedMbps,
        time: durationSec.toFixed(2),
        bytes: (sizeBytes / (1024 * 1024)).toFixed(2)
      });

      addLog(`Speedtest completed. Download throughput: ${speedMbps} Mbps`, 'success');
    } catch (err) {
      addLog(`Speedtest connection interrupted.`, 'error');
    } finally {
      setSpeedLoading(false);
    }
  };

  // Helper to resolve Map Bounds based on traceroute path
  const getMapBounds = () => {
    const validHops = tracePath.filter(h => h.lat !== null && h.lng !== null);
    if (validHops.length === 0) return null;
    return validHops.map(h => [h.lat, h.lng]);
  };

  const getLatencyColor = (latency, history) => {
    if (latency === null) {
      return (history && history.length > 0) ? 'offline' : 'loading';
    }
    if (latency < 80) return 'green';
    if (latency < 200) return 'orange';
    return 'red';
  };

  const renderSparkline = (history) => {
    if (!history || history.length === 0) return null;
    const cleanHistory = history.filter(v => v !== null);
    if (cleanHistory.length === 0) return null;
    const maxVal = Math.max(...cleanHistory, 80);
    const minVal = Math.min(...cleanHistory, 10);
    const range = maxVal - minVal || 1;
    const points = history.map((val, idx) => {
      if (val === null) return `${idx * 11}, 18`;
      const y = 18 - ((val - minVal) / range) * 16;
      return `${idx * 11},${y}`;
    }).join(' ');

    return (
      <svg className="sparkline-mini" viewBox="0 0 100 20">
        <polyline points={points} fill="none" stroke="var(--neon-blue)" strokeWidth="1.5" />
      </svg>
    );
  };

  const getMarkerIcon = (latency, history) => {
    const color = getLatencyColor(latency, history);
    const hexColor = color === 'green' ? '#10b981' : color === 'orange' ? '#f59e0b' : color === 'red' ? '#ef4444' : color === 'loading' ? 'var(--neon-blue)' : '#6b7280';
    return L.divIcon({
      className: 'map-pulse-marker',
      html: `
        <div class="pulse-dot" style="background-color: ${hexColor}; box-shadow: 0 0 8px ${hexColor};">
          <div class="pulse-ring" style="color: ${hexColor};"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  // RENDER LANDING PREVIEW PAGE
  if (viewState === 'landing') {
    return (
      <div className="landing-container">
        <div className="landing-cyber-grid"></div>
        <div className="landing-card">
          <div className="landing-logo-row">
            <Globe className="landing-globe-icon animate-pulse" size={48} />
            <h1 className="landing-title">NETSIGHT</h1>
          </div>
          <p className="landing-tagline">Personal Internet Observatory & Diagnostic Console</p>
          
          <div className="landing-specs-grid">
            <div className="spec-item">
              <Activity className="spec-icon blue" />
              <h3>Real-Time Latency Map</h3>
              <p>Monitor pings to global servers on a visual dark matter world map.</p>
            </div>
            <div className="spec-item">
              <Network className="spec-icon cyan" />
              <h3>Interactive Traceroute</h3>
              <p>Animate routing packet hops and geolocate network path relays.</p>
            </div>
            <div className="spec-item">
              <Search className="spec-icon green" />
              <h3>DNS Schema Analyzer</h3>
              <p>Deconstruct domain records (A, MX, TXT, NS) in a sleek terminal schema.</p>
            </div>
            <div className="spec-item">
              <DownloadCloud className="spec-icon orange" />
              <h3>Connection Speedometer</h3>
              <p>Measure raw downstream data throughput directly from local API nodes.</p>
            </div>
          </div>

          <button className="landing-start-btn" onClick={() => setViewState('booting')}>
            Initialize Observatory Console <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // RENDER BOOT LOADER SCREEN
  if (viewState === 'booting') {
    return (
      <div className="boot-loader-container">
        <div className="boot-loader-hud">
          <div className="boot-loader-spinner">
            <div className="spinner-inner"></div>
            <div className="spinner-center">
              <Globe size={40} className="glow-icon" />
            </div>
          </div>
          <h1 className="boot-loader-title">NETSIGHT SYSTEM BOOT</h1>
          <div className="boot-terminal-window">
            <div className="boot-terminal-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
              <span className="boot-terminal-title-text">observatory_init.log</span>
            </div>
            <div className="boot-terminal-body" ref={bootTerminalBodyRef}>
              {bootMessages.slice(0, bootStep).map((msg, index) => (
                <div key={index} className="terminal-line">
                  <span className="green-arrow">&gt;&gt;</span> {msg}
                </div>
              ))}
              {bootStep < bootMessages.length && (
                <div className="terminal-line blinking">
                  <span className="green-arrow">&gt;&gt;</span> Loading...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Background Cyber Grid */}
      <div className="cyber-grid-overlay"></div>
      
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo-container">
          <Globe className="logo-icon animate-pulse" size={24} onClick={() => setViewState('landing')} style={{ cursor: 'pointer' }} title="Back to Preview" />
          <span className="logo-text" onClick={() => setViewState('landing')} style={{ cursor: 'pointer' }}>NETSIGHT</span>
          <span className="logo-badge">V1.5 BETA</span>
        </div>
        <div className="system-status">
          <div className="status-dot"></div>
          <span>Observatory Engine Online</span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="dashboard-main">
        {/* Sidebar */}
        <section className="dashboard-sidebar">
          <nav className="sidebar-tabs">
            <button className={`tab-btn ${activeTab === 'obs' ? 'active' : ''}`} onClick={() => setActiveTab('obs')}>
              <Compass size={16} />
              <span>Observatory</span>
            </button>
            <button className={`tab-btn ${activeTab === 'dns' ? 'active' : ''}`} onClick={() => setActiveTab('dns')}>
              <Search size={16} />
              <span>DNS Lookup</span>
            </button>
            <button className={`tab-btn ${activeTab === 'speed' ? 'active' : ''}`} onClick={() => setActiveTab('speed')}>
              <DownloadCloud size={16} />
              <span>Speed Test</span>
            </button>
            <button className={`tab-btn ${activeTab === 'diag' ? 'active' : ''}`} onClick={() => setActiveTab('diag')}>
              <FileText size={16} />
              <span>Diagnostics</span>
            </button>
          </nav>

          <div className="tab-content">
            {/* TAB 1: Observatory Dashboard */}
            {activeTab === 'obs' && (
              <>
                {/* My Network Details */}
                <div className="network-card">
                  <div className="network-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Server size={12} style={{ color: 'var(--neon-blue)' }} />
                      <span>My Network Gateway</span>
                    </div>
                    {isGeoFallback && (
                      <span className="fallback-badge" title="Dynamic geolocation failed. Using offline Ranchi default.">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div className="network-card-body">
                    {loadingIp ? (
                      <div className="sidebar-loading-pulse">
                        <span>Locating external IP address...</span>
                      </div>
                    ) : myIpInfo ? (
                      <>
                        <div className="network-detail">
                          <span className="label">Public IP</span>
                          <span className="value glow-blue">{myIpInfo.query}</span>
                        </div>
                        <div className="network-detail">
                          <span className="label">ISP Provider</span>
                          <span className="value">{myIpInfo.isp}</span>
                        </div>
                        <div className="network-detail">
                          <span className="label">Location</span>
                          <span className="value">{myIpInfo.city}, {myIpInfo.countryCode}</span>
                        </div>
                      </>
                    ) : (
                      <div className="connection-error-box">
                        <AlertTriangle size={14} /> 
                        <span>Express backend disconnected. Measuring locally.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preset Profiles */}
                <div className="preset-section">
                  <span className="section-title">Observatory Profiles</span>
                  <div className="preset-grid">
                    <button className={`preset-btn ${activePreset === 'gaming' ? 'active' : ''}`} onClick={() => loadPreset('gaming')}>
                      Gaming Hops
                    </button>
                    <button className={`preset-btn ${activePreset === 'cloud' ? 'active' : ''}`} onClick={() => loadPreset('cloud')}>
                      Cloud Endpoints
                    </button>
                    <button className={`preset-btn ${activePreset === 'social' ? 'active' : ''}`} onClick={() => loadPreset('social')}>
                      Streaming/Media
                    </button>
                  </div>
                </div>

                {/* Add Target */}
                <div className="add-node-section">
                  <span className="section-title">Add Monitor Node</span>
                  <div className="input-group">
                    <input 
                      type="text" 
                      placeholder="Enter target IP or website"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="input-style"
                      onKeyDown={(e) => e.key === 'Enter' && addTargetNode()}
                    />
                    <button onClick={addTargetNode} className="btn-primary">
                      Add
                    </button>
                  </div>
                </div>

                {/* Active Monitors list */}
                <div className="active-observatories-section">
                  <span className="section-title">Active Observatories</span>
                  <div className="target-list">
                    {targets.map(t => (
                      <div className="target-card" key={t.id}>
                        <div className="target-card-left">
                          <div className="target-title-block">
                            <span className="target-url">{t.name}</span>
                            <span className="target-ip">{t.url}</span>
                          </div>
                          <div className="sparkline-wrapper">
                            {renderSparkline(t.history)}
                          </div>
                        </div>
                        <div className="target-metrics">
                          <div className={`latency-pill ${getLatencyColor(t.latency, t.history)}`}>
                            {t.latency !== null 
                              ? `${t.latency} ms` 
                              : (t.history && t.history.length > 0) ? 'Offline' : 'Loading...'}
                          </div>
                          <div className="action-buttons-group">
                            <button 
                              className="action-btn trace-btn" 
                              title="Visual Traceroute"
                              onClick={() => startTraceroute(t.url)}
                              disabled={tracing}
                            >
                              <Network size={14} />
                            </button>
                            <button className="action-btn delete-btn" title="Delete" onClick={() => deleteTarget(t.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: DNS Resolver */}
            {activeTab === 'dns' && (
              <div className="dns-panel-content">
                <div className="dns-input-wrapper">
                  <span className="section-title">DNS Record Query Console</span>
                  <div className="input-group">
                    <input 
                      type="text" 
                      placeholder="e.g. google.com"
                      value={dnsDomain}
                      onChange={(e) => setDnsDomain(e.target.value)}
                      className="input-style"
                      onKeyDown={(e) => e.key === 'Enter' && runDnsDetails()}
                    />
                    <button onClick={runDnsDetails} className="btn-primary" disabled={dnsLoading}>
                      Query
                    </button>
                  </div>
                </div>

                {dnsLoading && (
                  <div className="dns-loader-pulse">
                    <div className="double-bounce1"></div>
                    <div className="double-bounce2"></div>
                    <span>Querying Nameservers...</span>
                  </div>
                )}

                {dnsResults && (
                  <div className="dns-results-grid">
                    {Object.entries(dnsResults).map(([recordType, values]) => {
                      if (!values || (Array.isArray(values) && values.length === 0)) return null;
                      return (
                        <div className="dns-record-card" key={recordType}>
                          <div className="dns-record-type">{recordType}</div>
                          <div className="dns-record-value">
                            {Array.isArray(values) 
                              ? values.map((val, i) => typeof val === 'object' ? JSON.stringify(val) : val).join('\n')
                              : values.toString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {dnsError && (
                  <div className="dns-error-box">
                    <AlertTriangle size={16} className="dns-error-icon" />
                    <div className="dns-error-text">
                      <strong>Resolution Failed</strong>
                      <span>{dnsError}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Speed Test */}
            {activeTab === 'speed' && (
              <div className="speed-test-content">
                <span className="section-title">Network Throughput Profiler</span>
                
                <div className="speed-test-action-box">
                  <button className="btn-primary speed-run-btn" onClick={runSpeedTest} disabled={speedLoading}>
                    {speedLoading ? 'Profiling Connection...' : 'Start Speed Test'}
                  </button>
                </div>

                {speedLoading && (
                  <div className="radial-speed-progress-wrapper">
                    <div 
                      className="radial-spinner"
                      style={{ 
                        background: `conic-gradient(var(--neon-blue) 0deg, var(--neon-blue) ${speedProgress * 3.6}deg, var(--border-glass) ${speedProgress * 3.6}deg)` 
                      }}
                    >
                      <div className="radial-spinner-center">
                        <span className="radial-percent">{speedProgress}%</span>
                      </div>
                    </div>
                    <span className="radial-label">Downloading 5MB Packet...</span>
                  </div>
                )}

                {speedResult && (
                  <div className="speed-results-hud">
                    <div className="hud-metric-card speed">
                      <Zap size={24} className="hud-metric-icon" />
                      <span className="hud-metric-value glow-blue">{speedResult.speed}</span>
                      <span className="hud-metric-label">Mbps Download</span>
                    </div>
                    <div className="hud-metric-card duration">
                      <Activity size={24} className="hud-metric-icon" />
                      <span className="hud-metric-value">{speedResult.time}s</span>
                      <span className="hud-metric-label">Elapsed Time</span>
                    </div>
                  </div>
                )}

                <div className="speed-disclaimer-card" style={{ marginTop: '16px' }}>
                  <Info size={14} className="disclaimer-icon" style={{ color: 'var(--neon-blue)', flexShrink: 0 }} />
                  <span className="disclaimer-text">
                    <strong>Local Link Benchmark:</strong> This test measures connection throughput to the Observatory API loopback interface, representing maximum system pipeline efficiency rather than external ISP bandwidth.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 4: Diagnostics */}
            {activeTab === 'diag' && (
              <div className="diagnostics-content">
                <div className="diagnostics-header">
                  <span className="section-title">System Diagnostic Log</span>
                  <div className="diagnostic-score-badge" title="Calculated based on hop count and packet drop rate during the traceroute path mapping. Lower scores indicate high hop lengths or packet losses.">
                    <span className="score-label">Health Score:</span>
                    <span className={`score-value ${diagnosticScore > 80 ? 'green' : diagnosticScore > 50 ? 'orange' : 'red'}`}>
                      {diagnosticScore}/100
                    </span>
                  </div>
                </div>

                <div className="diagnostic-console-wrapper">
                  {diagnosticsLogs.length === 0 ? (
                    <div className="console-empty-state">
                      <Info size={16} />
                      <span>Diagnostics idle. Run a traceroute or speed test to stream metrics.</span>
                    </div>
                  ) : (
                    diagnosticsLogs.map((log, idx) => (
                      <div key={idx} className={`console-line ${log.type}`}>
                        <span className="line-time">[{log.time}]</span>
                        <span className="line-text">{log.msg}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Map and Diagnostics Output Panel */}
        <section className="dashboard-view">
          <div className="map-wrapper">
            <MapContainer 
              center={[20, 0]} 
              zoom={2} 
              style={{ width: '100%', height: '100%' }}
              zoomControl={true}
              minZoom={2}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                noWrap={true}
              />
              
              {/* Dynamic User Gateway Location Marker */}
              {myIpInfo && (
                <Marker 
                  position={[myIpInfo.lat, myIpInfo.lon]}
                  icon={L.divIcon({
                    className: 'map-pulse-marker home',
                    html: `
                      <div class="pulse-dot home" style="background-color: var(--neon-blue); box-shadow: 0 0 12px var(--neon-blue);">
                        <div class="pulse-ring" style="color: var(--neon-blue);"></div>
                      </div>
                    `,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                  })}
                >
                  <Popup>
                    <div className="map-popup-custom">
                      <strong className="popup-title">Local Gateway Node</strong>
                      <span className="popup-subtitle">My Current Location</span>
                      <div className="hop-meta-row" style={{ marginTop: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '6px' }}>
                        <span>IP</span>
                        <code>{myIpInfo.query}</code>
                      </div>
                      <div className="hop-meta-row">
                        <span>City</span>
                        <span>{myIpInfo.city}, {myIpInfo.countryCode || 'IN'}</span>
                      </div>
                      <div className="hop-meta-row">
                        <span>ISP</span>
                        <span>{myIpInfo.isp}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Plot Targets */}
              {targets.map(t => (
                <Marker 
                  key={t.id} 
                  position={[t.lat, t.lng]}
                  icon={getMarkerIcon(t.latency, t.history)}
                >
                  <Popup>
                    <div className="map-popup-custom">
                      <strong className="popup-title">{t.name}</strong>
                      <span className="popup-subtitle">{t.url}</span>
                      <div className="popup-latency-block">
                        <span>Latency</span>
                        <span className={`value ${getLatencyColor(t.latency, t.history)}`}>
                          {t.latency !== null 
                            ? `${t.latency} ms` 
                            : (t.history && t.history.length > 0) ? 'offline' : 'Loading...'}
                        </span>
                      </div>
                      <button 
                        onClick={() => startTraceroute(t.url)} 
                        disabled={tracing}
                        className="btn-popup-action"
                      >
                        {tracing ? 'Tracing Hops...' : 'Trace Path Route'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Draw polyline trace paths */}
              {tracePath.length > 0 && (
                <Polyline 
                  positions={tracePath.filter(h => h.lat !== null && h.lng !== null).map(h => [h.lat, h.lng])}
                  color="var(--neon-blue)"
                  weight={3.5}
                  dashArray="8, 10"
                  opacity={0.85}
                  lineCap="round"
                />
              )}

              {/* Plot Traceroute Hop Markers */}
              {tracePath.map((hop, index) => {
                // Skip rendering node marker for Ranchi if it is index 0 (as home is already plotted)
                if (index === 0 || !hop.lat || !hop.lng) return null;
                return (
                  <Marker 
                    key={index} 
                    position={[hop.lat, hop.lng]}
                    icon={L.divIcon({
                      className: 'map-hop-marker',
                      html: `<div style="background-color: var(--neon-cyan); width: 10px; height: 10px; border-radius: 50%; border: 2px solid #000; box-shadow: 0 0 8px var(--neon-cyan);"></div>`,
                      iconSize: [10, 10]
                    })}
                  >
                    <Popup>
                      <div className="map-popup-custom hop">
                        <strong className="popup-title">Hop {index + 1}</strong>
                        <div className="hop-meta-row">
                          <span>IP Address</span>
                          <code>{hop.ip}</code>
                        </div>
                        <div className="hop-meta-row">
                          <span>Geolocation</span>
                          <span>{hop.city || 'Private Node'}, {hop.country || 'LAN'}</span>
                        </div>
                        <div className="hop-meta-row">
                          <span>AS / ISP</span>
                          <span>{hop.isp || 'Internal Routing'}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Map updater to center or zoom ONLY once fitting bounds completes, preventing lockups */}
              <MapUpdater 
                center={tracePath.length > 0 && tracePath[0].lat ? [tracePath[0].lat, tracePath[0].lng] : null}
                bounds={getMapBounds()}
                triggerFit={triggerMapFit}
                onFitComplete={() => setTriggerMapFit(false)}
                initialCenter={[myIpInfo.lat, myIpInfo.lon]}
              />
            </MapContainer>
          </div>

          {/* Bottom Hop diagnostics drawer */}
          <div className="diagnostic-panel">
            <div className="panel-header">
              <span className="panel-title">
                <Cpu size={14} className="panel-title-icon" /> 
                <span>
                  {tracing ? `Tracing Hops: ${traceStatusMsg} (${tracePercent}%)` : selectedTarget ? `Traceroute Path: ${selectedTarget}` : 'Active Diagnostic Link'}
                </span>
              </span>
              {tracing && (
                <div className="active-hop-progress-bg">
                  <div className="active-hop-progress-fill" style={{ width: `${tracePercent}%` }}></div>
                </div>
              )}
              {selectedTarget && (
                <div className="private-node-info-tip" title="Hops within private local subnets (e.g. 192.168.x.x, 10.x.x.x) are local routing loops and do not have public registry coordinates. Only public internet transit nodes are mapped. If local ICMP requests are blocked by your firewall, NetSight uses geopath simulation fallback.">
                  <Info size={12} className="info-tip-icon" />
                  <span>Public Nodes Geolocated Only</span>
                </div>
              )}
              {selectedTarget && !tracing && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="panel-refresh-btn" 
                    onClick={() => startTraceroute(selectedTarget)}
                    title="Refresh Traceroute"
                  >
                    <RefreshCw size={12} />
                  </button>
                  <button 
                    className="panel-refresh-btn clear-btn" 
                    onClick={() => {
                      setSelectedTarget(null);
                      setTracePath([]);
                      setTraceStatusMsg('');
                      setTracePercent(0);
                    }}
                    title="Clear Traceroute Path"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>

            <div 
              className="hops-container"
              ref={hopsRefCallback}
            >
              {tracePath.length === 0 ? (
                <div className="hops-empty-state">
                  <Info size={14} /> 
                  <span>No visual traceroute data. Click the network path button on any active observatory card.</span>
                </div>
              ) : (
                <>
                  {tracePath.map((hop, index) => (
                    <div key={index} className="hop-wrapper-flow">
                      <div className={`hop-item ${hop.ip.includes('*') ? 'timeout' : ''} ${(!hop.lat && !hop.lng && !hop.ip.includes('*')) ? 'private-router' : ''}`}>
                        <span className="hop-num">{index + 1}</span>
                        <span className="hop-ip">{hop.ip}</span>
                        
                        {/* FIX: Clearly label private routing nodes that cannot be physically geolocated on the map! */}
                        {(!hop.lat && !hop.lng && !hop.ip.includes('*')) ? (
                          <>
                            <span className="hop-geo text-muted">Local ISP Routing Gateway</span>
                            <span className="hop-isp text-muted">Intranet Loop (No Map Location)</span>
                          </>
                        ) : (
                          <>
                            <span className="hop-geo">{hop.city ? `${hop.city}, ${hop.country}` : 'LAN Gateway'}</span>
                            <span className="hop-isp">{hop.isp || 'Internal Hop'}</span>
                          </>
                        )}
                      </div>
                      {(index < tracePath.length - 1 || tracing) && (
                        <ChevronRight size={18} className="hop-arrow-icon animate-pulse" />
                      )}
                    </div>
                  ))}
                  
                  {/* Dynamic scanning card shown at the end of hops container while actively tracing */}
                  {tracing && (
                    <div className="hop-wrapper-flow">
                      <div className="hop-item scanning-hop">
                        <span className="hop-num active-scan-pulse"></span>
                        <div className="scanning-dot-pulse"></div>
                        <span className="hop-ip">Tracing Hop {tracePath.length + 1}...</span>
                        <span className="hop-geo">Scanning Relay Gateway</span>
                        <span className="hop-isp text-muted">Awaiting ICMP Response...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
