// src/components/CombinedLogger.jsx
import React, { useEffect, useState } from "react";
import uuid from "react-uuid";

 // install with: npm install uuid

// ---- Device Profile Collector ----
async function getDeviceProfile() {
  // Persistent Device ID
  const localDeviceId =
    localStorage.getItem("deviceId") ||
    (() => {
      const newId = uuid();
      localStorage.setItem("deviceId", newId);
      return newId;
    })();

  const profile = {
    os: navigator.userAgent,
    platform: navigator.platform,
    browserLanguage: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    browserVendor: navigator.vendor,
    isBot: navigator.webdriver || false,
    deviceId: localDeviceId,
    jailBroken: false, // not detectable in browser
    ip: "unavailable",
    postal: "unavailable",
    city: "unavailable",
    state: "unavailable",
    country: "unavailable",
    isp: "unavailable",
  };

  // --- Geo + ISP fetch (with fallback) ---
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (res.ok) {
      const data = await res.json();
      profile.ip = data.ip || "unavailable";
      profile.postal = data.postal || "unavailable";
      profile.city = data.city || "unavailable";
      profile.state = data.region || "unavailable";
      profile.country = data.country_name || "unavailable";
      profile.isp = data.org || "unavailable";
    }
  } catch (e) {
    console.warn("Geo lookup failed, leaving defaults");
  }

  // --- Time offset (needs backend `/api/time`) ---
  try {
    const serverRes = await fetch("/api/time");
    if (serverRes.ok) {
      const serverTime = await serverRes.json(); // { utc: "2025-08-20T10:00:00Z" }
      const deviceTime = new Date();
      profile.timeOffsetMs =
        deviceTime.getTime() - new Date(serverTime.utc).getTime();
    } else {
      profile.timeOffsetMs = "server_not_available";
    }
  } catch (err) {
    profile.timeOffsetMs = "server_not_available";
  }

  return profile;
}

// ---- Main Logger Component ----
export default function CombinedLogger() {
  const [deviceProfile, setDeviceProfile] = useState({});
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Device Profile
    getDeviceProfile().then((profile) => setDeviceProfile(profile));

    // Behavior Event Capture
    const handleEvent = (e) => {
      setEvents((prev) => [
        ...prev,
        {
          type: e.type,
          timestamp: Date.now(),
          details: {
            x: e.clientX,
            y: e.clientY,
            key: e.key,
            target: e.target?.tagName,
          },
        },
      ]);
    };

    const eventTypes = [
      "click",
      "mousemove",
      "keydown",
      "scroll",
      "resize",
      "touchstart",
    ];

    eventTypes.forEach((ev) => window.addEventListener(ev, handleEvent));
    return () =>
      eventTypes.forEach((ev) => window.removeEventListener(ev, handleEvent));
  }, []);

  // Download JSON log
  const downloadLog = () => {
    const data = { deviceProfile, events };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "logger-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Device & Behavior Logger</h2>
      <button onClick={downloadLog}>Download JSON Log</button>

      <h3>Device Profile</h3>
      <pre>{JSON.stringify(deviceProfile, null, 2)}</pre>

      <h3>Behavior Events</h3>
      <pre>{JSON.stringify(events, null, 2)}</pre>
    </div>
  );
}