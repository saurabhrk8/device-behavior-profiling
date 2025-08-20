// src/components/CombinedLogger.jsx
import React, { useEffect, useState } from "react";

const CombinedLogger = () => {
  const [deviceData, setDeviceData] = useState({});
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const getDeviceProfile = async () => {
      const nav = navigator;

      // Battery info (async)
      let batteryInfo = {};
      try {
        if (nav.getBattery) {
          const battery = await nav.getBattery();
          batteryInfo = {
            batteryCharging: battery.charging,
            batteryLevel: battery.level,
            batteryChargingTime: battery.chargingTime,
            batteryDischargingTime: battery.dischargingTime
          };
        }
      } catch {}

      // Permissions info
      const permissions = {};
      try {
        const permList = [
          "geolocation",
          "notifications",
          "camera",
          "microphone",
          "clipboard-read",
          "clipboard-write"
        ];
        for (let perm of permList) {
          try {
            const status = await navigator.permissions.query({ name: perm });
            permissions[`perm_${perm}`] = status.state;
          } catch {
            permissions[`perm_${perm}`] = "unknown";
          }
        }
      } catch {}

      // Media devices
      let mediaDevices = [];
      try {
        if (nav.mediaDevices?.enumerateDevices) {
          const devices = await nav.mediaDevices.enumerateDevices();
          mediaDevices = devices.map((d) => ({ kind: d.kind, label: d.label }));
        }
      } catch {}

      const profile = {
        // Basic navigator details
        userAgent: nav.userAgent,
        appName: nav.appName,
        appVersion: nav.appVersion,
        platform: nav.platform,
        language: nav.language,
        languages: nav.languages,
        vendor: nav.vendor,
        product: nav.product,
        productSub: nav.productSub,
        hardwareConcurrency: nav.hardwareConcurrency,
        deviceMemory: nav.deviceMemory,
        onLine: nav.onLine,
        doNotTrack: nav.doNotTrack,
        cookieEnabled: nav.cookieEnabled,

        // Screen details
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth,
        orientationType: window.screen.orientation?.type,
        orientationAngle: window.screen.orientation?.angle,

        // Time & timezone
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,

        // Clipboard availability
        clipboardRead: !!nav.clipboard?.readText,
        clipboardWrite: !!nav.clipboard?.writeText,

        // Connection details
        connectionType: nav.connection?.effectiveType,
        downlink: nav.connection?.downlink,
        rtt: nav.connection?.rtt,
        saveData: nav.connection?.saveData,

        // Input devices
        maxTouchPoints: nav.maxTouchPoints,

        // Media devices
        mediaDevices: mediaDevices,

        // History & storage
        historyLength: window.history.length,
        localStorageSupport: !!window.localStorage,
        sessionStorageSupport: !!window.sessionStorage,
        indexedDBSupport: !!window.indexedDB,

        // Location support
        geolocationSupport: !!nav.geolocation,

        // Battery info
        ...batteryInfo,

        // Permissions info
        ...permissions
      };

      setDeviceData(profile);
    };

    getDeviceProfile();

    // === USER BEHAVIOR EVENTS TRACKING ===
    const eventTypes = [
      // Mouse events
      "click", "dblclick", "contextmenu", "mousedown", "mouseup", "mousemove",
      "mouseenter", "mouseleave", "mouseover", "mouseout",
      // Keyboard events
      "keydown", "keyup", "keypress",
      // Scroll & window events
      "scroll", "resize", "focus", "blur",
      // Form events
      "change", "input", "submit", "reset", "select",
      // Touch events
      "touchstart", "touchmove", "touchend", "touchcancel",
      // Pointer events
      "pointerover", "pointerenter", "pointerdown", "pointermove",
      "pointerup", "pointercancel", "pointerout", "pointerleave",
      // Drag & drop
      "drag", "dragstart", "dragend", "dragenter", "dragleave", "dragover", "drop",
      // Media events
      "play", "pause", "ended", "volumechange", "seeking", "seeked", "timeupdate",
      // Clipboard events
      "copy", "cut", "paste",
      // Animation/transition
      "animationstart", "animationend", "animationiteration",
      "transitionstart", "transitionend", "transitionrun", "transitioncancel"
    ];

    const handleEvent = (e) => {
      const entry = {
        type: e.type,
        timestamp: Date.now(),
        x: e.clientX || null,
        y: e.clientY || null,
        key: e.key || null,
        target: e.target?.tagName || null
      };
      setEvents((prev) => [...prev, entry]);
    };

    eventTypes.forEach((type) => window.addEventListener(type, handleEvent));

    return () => {
      eventTypes.forEach((type) => window.removeEventListener(type, handleEvent));
    };
  }, []);

  const downloadJSON = () => {
    const dataStr = JSON.stringify(
      { deviceProfile: deviceData, behaviorEvents: events },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "user_data_log.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h2>Combined Device + Behavior Logger</h2>
      <button onClick={downloadJSON}>Download JSON Log</button>
      <h3>Device Profile</h3>
      <pre style={{ maxHeight: "300px", overflowY: "scroll", background: "#eee", padding: "10px" }}>
        {JSON.stringify(deviceData, null, 2)}
      </pre>
      <h3>Behavior Events</h3>
      <pre style={{ maxHeight: "300px", overflowY: "scroll", background: "#eee", padding: "10px" }}>
        {JSON.stringify(events, null, 2)}
      </pre>
    </div>
  );
};

export default CombinedLogger;