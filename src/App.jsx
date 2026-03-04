import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  Circle,
  Type,
  MousePointer2,
  Image as ImageIcon,
  Download,
  Settings,
  Layers,
  Loader2,
  PenTool,
  ArrowUp,
  ArrowDown,
  Music,
  Volume2,
  VolumeX,
  Library,
  X,
  Hand,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Copy,
  Save,
  FolderOpen,
  FilePlus,
  Video,
  FileUp,
  Film,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Droplet,
  Monitor,
  Smartphone,
  Square as SquareIcon,
  Maximize2,
  Captions,
  CloudLightning,
  SlidersHorizontal,
  FastForward,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Scissors,
  ChevronsUp,
  ChevronsDown,
  Clapperboard,
} from "lucide-react";

const EASING_FUNCTIONS = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  bounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

const FONTS = [
  { name: "Default (Inter)", value: "Inter, sans-serif" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Courier New", value: "'Courier New', monospace" },
  { name: "Impact", value: "Impact, sans-serif" },
  { name: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
];

const FILTERS = [
  { name: "None", value: "" },
  { name: "Grayscale", value: "grayscale(100%)" },
  { name: "Sepia", value: "sepia(100%)" },
  { name: "Invert", value: "invert(100%)" },
  { name: "Vintage", value: "sepia(50%) contrast(120%) saturate(80%)" },
  { name: "High Contrast", value: "contrast(150%) saturate(120%)" },
];

const BUILT_IN_ASSETS = [
  {
    name: "Star",
    type: "path",
    points: [
      { x: 100, y: 20 },
      { x: 120, y: 80 },
      { x: 180, y: 80 },
      { x: 130, y: 120 },
      { x: 150, y: 180 },
      { x: 100, y: 140 },
      { x: 50, y: 180 },
      { x: 70, y: 120 },
      { x: 20, y: 80 },
      { x: 80, y: 80 },
      { x: 100, y: 20 },
    ],
  },
  {
    name: "Heart",
    type: "path",
    points: [
      { x: 100, y: 40 },
      { x: 140, y: 10 },
      { x: 180, y: 40 },
      { x: 180, y: 90 },
      { x: 100, y: 160 },
      { x: 20, y: 90 },
      { x: 20, y: 40 },
      { x: 60, y: 10 },
      { x: 100, y: 40 },
    ],
  },
  {
    name: "Arrow",
    type: "path",
    points: [
      { x: 20, y: 100 },
      { x: 140, y: 100 },
      { x: 140, y: 70 },
      { x: 180, y: 110 },
      { x: 140, y: 150 },
      { x: 140, y: 120 },
      { x: 20, y: 120 },
      { x: 20, y: 100 },
    ],
  },
  {
    name: "Check",
    type: "path",
    points: [
      { x: 30, y: 100 },
      { x: 80, y: 150 },
      { x: 170, y: 50 },
      { x: 150, y: 30 },
      { x: 80, y: 110 },
      { x: 50, y: 80 },
      { x: 30, y: 100 },
    ],
  },
];

const generateId = () =>
  new Date().getTime() + Math.floor(Math.random() * 10000);

const drawMarker = (ctx, x, y, scale = 1) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 / scale, 1 / scale);
  ctx.fillStyle = "#f59e0b";
  ctx.strokeStyle = "#b45309";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(15, -30);
  ctx.lineTo(25, -25);
  ctx.lineTo(0, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(2, -4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const getElementBounds = (el, ctx) => {
  if (el.type === "audio" || el.type === "camera" || el.type === "scene")
    return { x: 0, y: 0, width: 0, height: 0 };
  if (el.type === "circle") {
    return {
      x: el.x - el.radius - 10,
      y: el.y - el.radius - 10,
      width: el.radius * 2 + 20,
      height: el.radius * 2 + 20,
    };
  } else if (el.type === "rect" || el.type === "image" || el.type === "video") {
    return {
      x: el.x - 10,
      y: el.y - 10,
      width: el.width + 20,
      height: el.height + 20,
    };
  } else if (el.type === "text") {
    if (!ctx) {
      const cvs = document.createElement("canvas");
      ctx = cvs.getContext("2d");
    }
    const weight = el.fontWeight === "normal" ? "normal " : "bold ";
    const style = el.fontStyle === "italic" ? "italic " : "normal ";
    ctx.font = `${style}${weight}${el.fontSize || 32}px ${
      el.fontFamily || "Inter, sans-serif"
    }`;

    const lines = el.content.split("\n");
    let maxWidth = 0;
    lines.forEach(
      (l) => (maxWidth = Math.max(maxWidth, ctx.measureText(l).width))
    );
    const fs = el.fontSize || 32;
    let startX = el.x;
    if (el.textAlign === "center") startX = el.x - maxWidth / 2;
    if (el.textAlign === "right") startX = el.x - maxWidth;
    return {
      x: startX - 10,
      y: el.y - fs - 10,
      width: maxWidth + 20,
      height: fs * lines.length + 20,
    };
  } else if (el.type === "path") {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    el.points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    return {
      x: minX - 10,
      y: minY - 10,
      width: maxX - minX + 20,
      height: maxY - minY + 20,
    };
  }
  return { x: 0, y: 0, width: 0, height: 0 };
};

export default function App() {
  // --- State Management ---
  const [projectSettings, setProjectSettings] = useState(() => {
    const saved = localStorage.getItem("multiformat_project_v4");
    if (saved) {
      try {
        return (
          JSON.parse(saved).settings || {
            duration: 15000,
            bgColor: "#f8fafc",
            aspectRatio: "16:9",
            showSafeZones: false,
          }
        );
      } catch {
        /* ignore */
      }
    }
    return {
      duration: 15000,
      bgColor: "#f8fafc",
      aspectRatio: "16:9",
      showSafeZones: false,
    };
  });

  const [elements, setElements] = useState(() => {
    const saved = localStorage.getItem("multiformat_project_v4");
    if (saved) {
      try {
        return JSON.parse(saved).elements || [];
      } catch {
        /* ignore */
      }
    }
    return [
      {
        id: 1,
        type: "text",
        content: "Scene 1: Welcome",
        x: 200,
        y: 150,
        fontSize: 36,
        fontFamily: "Inter, sans-serif",
        textAlign: "left",
        fontWeight: "bold",
        fontStyle: "normal",
        textDecoration: "none",
        color: "#0f172a",
        animStart: 0,
        animDuration: 5000,
        introDuration: 1500,
        outroDuration: 500,
        outroType: "fade",
        animType: "draw",
        easing: "easeOut",
        rotation: 0,
        blendMode: "source-over",
        opacity: 1,
        shadowBlur: 0,
        strokeWidth: 0,
        textBgColor: "",
        borderRadius: 0,
        locked: false,
        hidden: false,
      },
      {
        id: 2,
        type: "scene",
        bgColor: "#e0f2fe",
        animStart: 6000,
        animDuration: 2000,
        content: "Scene 2 Transition",
      },
      {
        id: 3,
        type: "text",
        content: "Fresh Screen!",
        x: 200,
        y: 200,
        fontSize: 48,
        fontFamily: "Impact, sans-serif",
        textAlign: "left",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        color: "#0369a1",
        animStart: 6500,
        animDuration: 5000,
        introDuration: 1000,
        outroDuration: 500,
        outroType: "scale",
        animType: "scale",
        easing: "bounce",
        rotation: -5,
        blendMode: "source-over",
        opacity: 1,
        shadowBlur: 0,
        strokeWidth: 0,
        textBgColor: "",
        borderRadius: 0,
        locked: false,
        hidden: false,
      },
    ];
  });

  let canvasWidth = 800;
  let canvasHeight = 450;
  switch (projectSettings.aspectRatio) {
    case "9:16":
      canvasHeight = 640;
      canvasWidth = 360;
      break;
    case "1:1":
      canvasHeight = 500;
      canvasWidth = 500;
      break;
    case "4:5":
      canvasHeight = 600;
      canvasWidth = 480;
      break;
    case "16:9":
    default:
      canvasWidth = 800;
      canvasHeight = 450;
      break;
  }

  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const dragStartElementsRef = useRef(null);

  const [selectedElementId, setSelectedElementId] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [currentPath, setCurrentPath] = useState(null);

  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [snapLines, setSnapLines] = useState({ x: null, y: null });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioRefs = useRef({});
  const videoRefs = useRef({});

  useEffect(() => {
    const savableElements = elements.filter(
      (el) => el.type !== "audio" || (el.src && el.src.length < 500000)
    );
    try {
      localStorage.setItem(
        "multiformat_project_v4",
        JSON.stringify({ elements: savableElements, settings: projectSettings })
      );
    } catch {
      console.warn("Storage quota exceeded.");
    }
  }, [elements, projectSettings]);

  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const commitHistory = useCallback(
    (newElements) => {
      setPast((p) => [...p, elements]);
      setElements(newElements);
      setFuture([]);
    },
    [elements]
  );

  const handleUndo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setFuture((f) => [elements, ...f]);
      setElements(previous);
      return prev.slice(0, prev.length - 1);
    });
    setSelectedElementId(null);
  }, [elements]);

  const handleRedo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      setPast((p) => [...p, elements]);
      setElements(next);
      return prev.slice(1);
    });
    setSelectedElementId(null);
  }, [elements]);

  const handleDelete = useCallback(() => {
    if (selectedElementId) {
      commitHistory(elements.filter((el) => el.id !== selectedElementId));
      setSelectedElementId(null);
    }
  }, [selectedElementId, elements, commitHistory]);

  const handleDuplicate = useCallback(() => {
    if (selectedElementId) {
      const elToCopy = elements.find((e) => e.id === selectedElementId);
      if (!elToCopy) return;
      const newEl = { ...elToCopy, id: generateId() };
      if (newEl.type === "path" && newEl.points) {
        newEl.points = newEl.points.map((p) => ({ x: p.x + 20, y: p.y + 20 }));
      } else if (newEl.x !== undefined) {
        newEl.x += 20;
        newEl.y += 20;
      }
      commitHistory([...elements, newEl]);
      setSelectedElementId(newEl.id);
    }
  }, [selectedElementId, elements, commitHistory]);

  const handleSplit = useCallback(() => {
    if (!selectedElementId) return;
    const el = elements.find((e) => e.id === selectedElementId);
    if (time <= el.animStart || time >= el.animStart + el.animDuration) return;

    const timeDiff = time - el.animStart;
    const el1 = { ...el, animDuration: timeDiff, outroDuration: 0 };
    const el2 = {
      ...el,
      id: generateId(),
      animStart: time,
      animDuration: el.animDuration - timeDiff,
      introDuration: 0,
    };

    if (el.type === "video" || el.type === "audio") {
      el2.trimStart = (el.trimStart || 0) + timeDiff;
    }

    const newElements = elements.map((e) => (e.id === el.id ? el1 : e));
    newElements.push(el2);
    commitHistory(newElements);
    setSelectedElementId(el2.id);
  }, [selectedElementId, elements, time, commitHistory]);

  const handleSendToBack = useCallback(() => {
    if (!selectedElementId) return;
    const el = elements.find((e) => e.id === selectedElementId);
    const others = elements.filter((e) => e.id !== selectedElementId);
    commitHistory([el, ...others]);
  }, [selectedElementId, elements, commitHistory]);

  const handleBringToFront = useCallback(() => {
    if (!selectedElementId) return;
    const el = elements.find((e) => e.id === selectedElementId);
    const others = elements.filter((e) => e.id !== selectedElementId);
    commitHistory([...others, el]);
  }, [selectedElementId, elements, commitHistory]);

  const handleAspectRatioChange = useCallback(
    (newRatio) => {
      let newWidth = 800;
      let newHeight = 450;
      let maxDuration = 600000;
      if (newRatio === "9:16") {
        newWidth = 360;
        newHeight = 640;
        maxDuration = 60000;
      }
      if (newRatio === "1:1") {
        newWidth = 500;
        newHeight = 500;
      }
      if (newRatio === "4:5") {
        newWidth = 480;
        newHeight = 600;
      }

      const diffX = newWidth / 2 - canvasWidth / 2;
      const diffY = newHeight / 2 - canvasHeight / 2;

      const reframedElements = elements.map((el) => {
        if (el.type === "audio" || el.type === "camera" || el.type === "scene")
          return el;
        if (el.type === "path" && el.points)
          return {
            ...el,
            points: el.points.map((p) => ({ x: p.x + diffX, y: p.y + diffY })),
          };
        if (el.x !== undefined && el.y !== undefined)
          return { ...el, x: el.x + diffX, y: el.y + diffY };
        return el;
      });

      let newDuration = projectSettings.duration;
      if (newRatio === "9:16" && newDuration > maxDuration)
        newDuration = maxDuration;
      commitHistory(reframedElements);
      setProjectSettings((prev) => ({
        ...prev,
        aspectRatio: newRatio,
        duration: newDuration,
      }));
      setViewport({ x: 0, y: 0, scale: 1 });
    },
    [
      canvasWidth,
      canvasHeight,
      elements,
      projectSettings.duration,
      commitHistory,
    ]
  );

  const generateAutoCaptions = useCallback(() => {
    const captionTexts = [
      "Add engaging",
      "captions fast!",
      "Auto-syncs",
      "to your audio.",
    ];
    const newElements = [];
    const center = { x: canvasWidth / 2, y: canvasHeight - 150 };

    captionTexts.forEach((text, i) => {
      newElements.push({
        id: generateId() + i,
        type: "text",
        content: text,
        x: center.x,
        y: center.y,
        fontSize: 36,
        fontFamily: "Impact, sans-serif",
        textAlign: "center",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        color: "#ffffff",
        strokeColor: "#000000",
        strokeWidth: 6,
        shadowBlur: 10,
        shadowColor: "rgba(0,0,0,0.8)",
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        animStart: time + i * 1500,
        animDuration: 1500,
        introDuration: 200,
        outroDuration: 200,
        outroType: "fade",
        animType: "scale",
        easing: "easeOut",
        rotation: 0,
        blendMode: "source-over",
        opacity: 1,
        textBgColor: "",
      });
    });
    commitHistory([...elements, ...newElements]);
  }, [canvasWidth, canvasHeight, elements, time, commitHistory]);

  const handleSaveProject = useCallback(() => {
    const projectData = {
      version: "4.0",
      timestamp: generateId(),
      settings: projectSettings,
      elements: elements,
    };
    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "animation-project.wbproj";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [elements, projectSettings]);

  const handleLoadProject = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.elements && Array.isArray(parsed.elements)) {
            commitHistory(parsed.elements);
            if (parsed.settings) setProjectSettings(parsed.settings);
          } else if (Array.isArray(parsed)) {
            commitHistory(parsed);
          }
        } catch (err) {
          console.error("Failed to parse project file.", err);
        }
      };
      reader.readAsText(file);
      e.target.value = null;
    },
    [commitHistory]
  );

  const handleImportSubProject = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          let importedElements = parsed.elements || parsed;
          if (Array.isArray(importedElements)) {
            const newElements = importedElements.map((impEl) => ({
              ...impEl,
              id: generateId(),
              animStart: impEl.animStart + time,
            }));
            commitHistory([...elements, ...newElements]);
          }
        } catch (err) {
          console.error("Failed to parse project file.", err);
        }
      };
      reader.readAsText(file);
      e.target.value = null;
    },
    [commitHistory, elements, time]
  );

  const handleNewProject = useCallback(() => {
    commitHistory([]);
    setTime(0);
    setViewport({ x: 0, y: 0, scale: 1 });
  }, [commitHistory]);

  const getViewportCenter = useCallback(() => {
    return {
      x: (canvasWidth / 2 - viewport.x) / viewport.scale,
      y: (canvasHeight / 2 - viewport.y) / viewport.scale,
    };
  }, [viewport.scale, viewport.x, viewport.y, canvasWidth, canvasHeight]);

  // --- IMPORT MEDIA HANDLERS ---
  const handleImageUpload = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const center = getViewportCenter();
          const width = 200;
          const height = 200 * (img.height / img.width);
          const newEl = {
            id: generateId(),
            type: "image",
            content: file.name,
            src: event.target.result,
            x: center.x - width / 2,
            y: center.y - height / 2,
            width,
            height,
            animStart: time,
            animDuration: 5000,
            introDuration: 1000,
            outroDuration: 0,
            outroType: "fade",
            animType: "draw",
            rotation: 0,
            blendMode: "source-over",
            opacity: 1,
            shadowBlur: 0,
            borderRadius: 0,
            locked: false,
            hidden: false,
          };
          commitHistory([...elements, newEl]);
          setSelectedElementId(newEl.id);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
      e.target.value = null;
    },
    [commitHistory, elements, getViewportCenter, time]
  );

  const handleVideoUpload = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.onloadedmetadata = () => {
        const center = getViewportCenter();
        const width = 300;
        const height = 300 * (video.videoHeight / video.videoWidth);
        const newEl = {
          id: generateId(),
          type: "video",
          content: file.name,
          src: url,
          x: center.x - width / 2,
          y: center.y - height / 2,
          width,
          height,
          animStart: time,
          animDuration: Math.min(
            video.duration * 1000,
            projectSettings.duration - time
          ),
          introDuration: 1000,
          outroDuration: 0,
          outroType: "fade",
          animType: "fade",
          rotation: 0,
          blendMode: "source-over",
          trimStart: 0,
          opacity: 1,
          shadowBlur: 0,
          borderRadius: 0,
          locked: false,
          hidden: false,
        };
        commitHistory([...elements, newEl]);
        setSelectedElementId(newEl.id);
      };
      e.target.value = null;
    },
    [commitHistory, elements, getViewportCenter, projectSettings.duration, time]
  );

  const handleAudioUpload = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target.result;
        const audio = new window.Audio(url);
        audio.onloadedmetadata = () => {
          const newEl = {
            id: generateId(),
            type: "audio",
            content: file.name,
            src: url,
            volume: 1,
            animStart: time,
            animDuration: Math.min(
              audio.duration * 1000,
              projectSettings.duration - time
            ),
            trimStart: 0,
            muted: false,
            locked: false,
          };
          commitHistory([...elements, newEl]);
          setSelectedElementId(newEl.id);
        };
      };
      reader.readAsDataURL(file);
      e.target.value = null;
    },
    [commitHistory, elements, projectSettings.duration, time]
  );

  const addElement = useCallback(
    (type) => {
      const center = getViewportCenter();
      const newEl = {
        id: generateId(),
        type,
        x: center.x - 50,
        y: center.y - 50,
        color: "#0f172a",
        animStart: time,
        animDuration: type === "scene" ? 2000 : 5000,
        introDuration: 1000,
        outroDuration: 0,
        outroType: "fade",
        animType: type === "camera" ? "camera" : "draw",
        easing: type === "camera" ? "easeInOut" : "linear",
        rotation: 0,
        blendMode: "source-over",
        opacity: 1,
        shadowBlur: 0,
        locked: false,
        hidden: false,
      };
      if (type === "text") {
        newEl.content = "New Text Element";
        newEl.fontSize = 32;
        newEl.fontFamily = "Inter, sans-serif";
        newEl.textAlign = "left";
        newEl.fontWeight = "bold";
        newEl.fontStyle = "normal";
        newEl.textDecoration = "none";
        newEl.strokeWidth = 0;
        newEl.strokeColor = "#000000";
        newEl.textBgColor = "";
        newEl.y += 32;
      }
      if (type === "circle") {
        newEl.radius = 50;
        newEl.x += 50;
        newEl.y += 50;
      }
      if (type === "rect") {
        newEl.width = 100;
        newEl.height = 100;
        newEl.borderRadius = 0;
      }
      if (type === "camera") {
        newEl.viewport = { ...viewport };
        newEl.content = "Scene Pan/Zoom";
      }
      if (type === "scene") {
        newEl.bgColor = projectSettings.bgColor;
        newEl.content = "Scene Break";
      }

      commitHistory([...elements, newEl]);
      setSelectedElementId(newEl.id);
    },
    [
      commitHistory,
      elements,
      getViewportCenter,
      time,
      viewport,
      projectSettings.bgColor,
    ]
  );

  // --- Audio, Video & Camera Sync Engine ---
  useEffect(() => {
    elements
      .filter((e) => e.type === "audio")
      .forEach((track) => {
        let audioEl = audioRefs.current[track.id];
        if (!audioEl) {
          audioEl = new window.Audio(track.src);
          audioRefs.current[track.id] = audioEl;
        }

        audioEl.volume = track.muted
          ? 0
          : track.volume !== undefined
          ? track.volume
          : 1;
        audioEl.playbackRate = track.playbackRate || 1;

        if (isPlaying && !isExporting) {
          if (
            time >= track.animStart &&
            time < track.animStart + track.animDuration
          ) {
            const expectedTime =
              ((time - track.animStart) / 1000) * (track.playbackRate || 1) +
              (track.trimStart || 0) / 1000;
            if (Math.abs(audioEl.currentTime - expectedTime) > 0.2)
              audioEl.currentTime = expectedTime;
            if (audioEl.paused) audioEl.play().catch((err) => console.log(err));
          } else {
            if (!audioEl.paused) audioEl.pause();
          }
        } else {
          if (!audioEl.paused) audioEl.pause();
          if (
            time >= track.animStart &&
            time < track.animStart + track.animDuration
          ) {
            audioEl.currentTime =
              ((time - track.animStart) / 1000) * (track.playbackRate || 1) +
              (track.trimStart || 0) / 1000;
          }
        }
      });

    const currentAudioIds = elements
      .filter((e) => e.type === "audio")
      .map((e) => e.id);
    Object.keys(audioRefs.current).forEach((id) => {
      if (!currentAudioIds.includes(parseInt(id))) {
        audioRefs.current[id].pause();
        delete audioRefs.current[id];
      }
    });

    elements
      .filter((e) => e.type === "video")
      .forEach((track) => {
        let videoEl = videoRefs.current[track.id];
        if (!videoEl) {
          videoEl = document.createElement("video");
          videoEl.src = track.src;
          videoEl.muted = true;
          videoEl.crossOrigin = "anonymous";
          videoRefs.current[track.id] = videoEl;
        }

        videoEl.playbackRate = track.playbackRate || 1;

        if (isPlaying && !isExporting) {
          if (
            time >= track.animStart &&
            time < track.animStart + track.animDuration
          ) {
            const expectedTime =
              ((time - track.animStart) / 1000) * (track.playbackRate || 1) +
              (track.trimStart || 0) / 1000;
            if (Math.abs(videoEl.currentTime - expectedTime) > 0.2)
              videoEl.currentTime = expectedTime;
            if (videoEl.paused) videoEl.play().catch((err) => console.log(err));
          } else {
            if (!videoEl.paused) videoEl.pause();
          }
        } else {
          if (!videoEl.paused) videoEl.pause();
          if (
            time >= track.animStart &&
            time < track.animStart + track.animDuration
          ) {
            videoEl.currentTime =
              ((time - track.animStart) / 1000) * (track.playbackRate || 1) +
              (track.trimStart || 0) / 1000;
          }
        }
      });

    const currentVideoIds = elements
      .filter((e) => e.type === "video")
      .map((e) => e.id);
    Object.keys(videoRefs.current).forEach((id) => {
      if (!currentVideoIds.includes(parseInt(id))) {
        videoRefs.current[id].pause();
        videoRefs.current[id].src = "";
        delete videoRefs.current[id];
      }
    });

    if (isPlaying || isExporting) {
      const cameras = elements
        .filter((e) => e.type === "camera")
        .sort((a, b) => a.animStart - b.animStart);
      if (cameras.length > 0) {
        let currentCam = null;
        let prevCam = { x: 0, y: 0, scale: 1, animStart: 0 };
        for (let i = 0; i < cameras.length; i++) {
          if (time >= cameras[i].animStart)
            prevCam = {
              ...cameras[i].viewport,
              animStart: cameras[i].animStart,
              animDuration: cameras[i].animDuration,
            };
          if (
            time >= cameras[i].animStart &&
            time < cameras[i].animStart + cameras[i].animDuration
          ) {
            currentCam = cameras[i];
            let beforeCam = { x: 0, y: 0, scale: 1 };
            if (i > 0) beforeCam = cameras[i - 1].viewport;
            let progress =
              (time - currentCam.animStart) / currentCam.animDuration;
            progress =
              EASING_FUNCTIONS[currentCam.easing || "easeInOut"](progress);
            const newX =
              beforeCam.x + (currentCam.viewport.x - beforeCam.x) * progress;
            const newY =
              beforeCam.y + (currentCam.viewport.y - beforeCam.y) * progress;
            const newScale =
              beforeCam.scale +
              (currentCam.viewport.scale - beforeCam.scale) * progress;
            requestAnimationFrame(() =>
              setViewport({ x: newX, y: newY, scale: newScale })
            );
            return;
          }
        }
        if (!currentCam && time >= prevCam.animStart) {
          requestAnimationFrame(() =>
            setViewport({ x: prevCam.x, y: prevCam.y, scale: prevCam.scale })
          );
        }
      }
    }
  }, [isPlaying, time, elements, isExporting]);

  useEffect(() => {
    let req;
    if (isPlaying) {
      let lastT = performance.now();
      const loop = (t) => {
        const dt = t - lastT;
        lastT = t;
        setTime((prev) => {
          const nextTime = prev + dt;
          if (nextTime >= projectSettings.duration) {
            setIsPlaying(false);
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === "recording"
            )
              mediaRecorderRef.current.stop();
            return projectSettings.duration;
          }
          return nextTime;
        });
        req = requestAnimationFrame(loop);
      };
      req = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(req);
  }, [isPlaying, projectSettings.duration]);

  // --- Canvas Rendering Engine (with Scene Architecture) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // 1. Calculate Active Scene Background
    const scenes = [
      { id: "default", animStart: 0, bgColor: projectSettings.bgColor },
      ...elements
        .filter((e) => e.type === "scene")
        .sort((a, b) => a.animStart - b.animStart),
    ];
    let currentScene = scenes[0];
    let nextSceneStart = projectSettings.duration;

    for (let i = 0; i < scenes.length; i++) {
      if (time >= scenes[i].animStart) {
        currentScene = scenes[i];
        nextSceneStart = scenes[i + 1]
          ? scenes[i + 1].animStart
          : projectSettings.duration;
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = currentScene.bgColor || "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.scale, viewport.scale);

    // Draw Grid (behind elements)
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1 / viewport.scale;
    ctx.globalAlpha = 0.5;
    const gridSize = 50;

    const startX = -viewport.x / viewport.scale;
    const startY = -viewport.y / viewport.scale;
    const endX = startX + canvas.width / viewport.scale;
    const endY = startY + canvas.height / viewport.scale;
    const firstGridX = Math.floor(startX / gridSize) * gridSize;
    const firstGridY = Math.floor(startY / gridSize) * gridSize;

    ctx.beginPath();
    for (let x = firstGridX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = firstGridY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // 2. Render Elements
    elements
      .filter(
        (el) =>
          el.type !== "audio" &&
          el.type !== "camera" &&
          el.type !== "scene" &&
          !el.hidden
      )
      .forEach((el) => {
        // SCENE ENFORCEMENT: Only elements starting in the current scene are visible
        if (
          el.animStart < currentScene.animStart ||
          el.animStart >= nextSceneStart
        )
          return;

        // LIFESPAN ENFORCEMENT: Element is only visible between its animStart and animStart + animDuration
        if (time < el.animStart || time > el.animStart + el.animDuration)
          return;

        let introDuration =
          el.introDuration !== undefined
            ? el.introDuration
            : Math.min(1500, el.animDuration);
        let outroDuration = el.outroDuration || 0;

        let rawProgress =
          introDuration > 0
            ? Math.min(1, Math.max(0, (time - el.animStart) / introDuration))
            : 1;
        let progress = EASING_FUNCTIONS[el.easing || "linear"](rawProgress);

        let rawOutro = 0;
        if (
          outroDuration > 0 &&
          time > el.animStart + el.animDuration - outroDuration
        ) {
          rawOutro = Math.min(
            1,
            Math.max(
              0,
              (time - (el.animStart + el.animDuration - outroDuration)) /
                outroDuration
            )
          );
        }

        ctx.save();
        if (el.blendMode && el.blendMode !== "source-over")
          ctx.globalCompositeOperation = el.blendMode;

        if (el.type === "image" || el.type === "video") {
          ctx.filter = `brightness(${el.brightness ?? 100}%) contrast(${
            el.contrast ?? 100
          }%) saturate(${el.saturation ?? 100}%) blur(${el.blur ?? 0}px) ${
            el.presetFilter ? el.presetFilter : ""
          }`;
        }

        let currentAlpha = el.opacity !== undefined ? el.opacity : 1;
        if (el.animType === "fade") currentAlpha *= progress;

        // Outro processing
        if (rawOutro > 0) {
          if (!el.outroType || el.outroType === "fade")
            currentAlpha *= 1 - rawOutro;
        }
        ctx.globalAlpha = currentAlpha;

        let bounds = getElementBounds(el, ctx);
        let cx = bounds.x + bounds.width / 2;
        let cy = bounds.y + bounds.height / 2;

        let mx = 0,
          my = 0;
        if (el.animType === "move") {
          mx = (el.motionX || 0) * progress;
          my = (el.motionY || 0) * progress;
        }

        ctx.translate(mx, my);
        ctx.translate(cx, cy);
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

        if (el.animType === "scale") {
          const s = Math.max(0.01, progress);
          ctx.scale(s, s);
          rawProgress = 1; // Mark drawing as complete so pen doesn't render
        }

        if (rawOutro > 0 && el.outroType === "scale") {
          const sOut = Math.max(0.01, 1 - rawOutro);
          ctx.scale(sOut, sOut);
        }

        ctx.translate(-cx, -cy);

        if (el.shadowBlur > 0) {
          ctx.shadowColor = el.shadowColor || "rgba(0,0,0,0.5)";
          ctx.shadowBlur = el.shadowBlur;
          ctx.shadowOffsetX = el.shadowOffsetX || 0;
          ctx.shadowOffsetY = el.shadowOffsetY || 0;
        }

        if (
          el.animType === "move" ||
          el.animType === "fade" ||
          el.animType === "scale"
        ) {
          if (
            rawProgress < 1 &&
            el.animType === "move" &&
            isPlaying &&
            !isExporting
          )
            drawMarker(ctx, cx, cy, viewport.scale);
          rawProgress = 1; // Force 100% path drawing for non-draw animations
        }

        if (el.animType === "particles") {
          if (rawProgress < 1) {
            const numParticles = 25;
            const seed = el.id;
            ctx.fillStyle = el.color || "#000";
            for (let i = 0; i < numParticles; i++) {
              const pLife = ((time - el.animStart + i * 150) % 1500) / 1500;
              if (pLife >= 0 && pLife <= 1 && time > el.animStart) {
                const rx = Math.sin(seed + i) * bounds.width;
                const ry = Math.cos(seed + i) * bounds.height;
                ctx.globalAlpha =
                  (1 - pLife) * (el.opacity !== undefined ? el.opacity : 1);
                ctx.beginPath();
                ctx.arc(
                  cx + rx + rx * pLife * 1.5,
                  cy + ry - pLife * 150,
                  5 * (1 - pLife),
                  0,
                  Math.PI * 2
                );
                ctx.fill();
              }
            }
          }
          rawProgress = 1;
          ctx.globalAlpha =
            rawProgress * (el.opacity !== undefined ? el.opacity : 1);
        }

        ctx.strokeStyle = el.color || "#000";
        ctx.fillStyle = el.color || "#000";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (el.type === "text") {
          const charsToShow = Math.floor(rawProgress * el.content.length);
          const textToDraw = el.content.substring(0, charsToShow);

          const weight = el.fontWeight === "normal" ? "normal " : "bold ";
          const style = el.fontStyle === "italic" ? "italic " : "normal ";
          ctx.font = `${style}${weight}${el.fontSize || 32}px ${
            el.fontFamily || "Inter, sans-serif"
          }`;
          ctx.textAlign = el.textAlign || "left";
          ctx.textBaseline = "top";

          const lines = el.content.split("\n");
          let charsDrawn = 0;
          let markerPos = { x: el.x, y: el.y };

          lines.forEach((line, index) => {
            if (charsDrawn >= charsToShow) return;
            const remaining = charsToShow - charsDrawn;
            const textLine = line.substring(0, remaining);
            const yOffset = el.y + index * (el.fontSize || 32) * 1.2;

            const textWidth = ctx.measureText(textLine).width;
            let bgX = el.x;
            if (el.textAlign === "center") bgX = el.x - textWidth / 2;
            if (el.textAlign === "right") bgX = el.x - textWidth;

            if (el.textBgColor) {
              ctx.save();
              ctx.shadowBlur = 0;
              ctx.fillStyle = el.textBgColor;
              ctx.fillRect(
                bgX - 8,
                yOffset - 4,
                textWidth + 16,
                (el.fontSize || 32) + 8
              );
              ctx.restore();
            }

            if (el.strokeWidth && el.strokeWidth > 0) {
              ctx.lineWidth = el.strokeWidth;
              ctx.strokeStyle = el.strokeColor || "#000000";
              ctx.strokeText(textLine, el.x, yOffset);
              ctx.strokeStyle = el.color || "#000";
            }
            ctx.fillText(textLine, el.x, yOffset);

            // Underline rendering
            if (el.textDecoration === "underline") {
              ctx.save();
              ctx.shadowBlur = 0; // Disable shadow for clean underline
              ctx.lineWidth = Math.max(1, (el.fontSize || 32) / 15);
              ctx.strokeStyle = el.color || "#000";
              ctx.beginPath();
              ctx.moveTo(bgX, yOffset + (el.fontSize || 32) * 1.05);
              ctx.lineTo(bgX + textWidth, yOffset + (el.fontSize || 32) * 1.05);
              ctx.stroke();
              ctx.restore();
            }

            charsDrawn += line.length + 1;

            if (charsDrawn >= charsToShow) {
              let rightEdge = el.x + ctx.measureText(textLine).width;
              if (el.textAlign === "center")
                rightEdge = el.x + ctx.measureText(textLine).width / 2;
              if (el.textAlign === "right") rightEdge = el.x;
              markerPos = {
                x: rightEdge + 5,
                y: yOffset + (el.fontSize || 32) / 2,
              };
            }
          });

          if (
            rawProgress < 1 &&
            isPlaying &&
            !isExporting &&
            el.animType === "draw"
          )
            drawMarker(ctx, markerPos.x, markerPos.y, viewport.scale);
        } else if (el.type === "circle") {
          ctx.beginPath();
          ctx.arc(
            el.x,
            el.y,
            el.radius,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * rawProgress
          );
          if (el.shadowBlur > 0 && el.animType === "draw" && rawProgress < 1)
            ctx.shadowBlur = 0;
          ctx.stroke();
          if (
            rawProgress < 1 &&
            isPlaying &&
            !isExporting &&
            el.animType === "draw"
          ) {
            drawMarker(
              ctx,
              el.x +
                Math.cos(-Math.PI / 2 + Math.PI * 2 * rawProgress) * el.radius,
              el.y +
                Math.sin(-Math.PI / 2 + Math.PI * 2 * rawProgress) * el.radius,
              viewport.scale
            );
          }
        } else if (el.type === "rect") {
          if (el.borderRadius && rawProgress === 1 && ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(el.x, el.y, el.width, el.height, el.borderRadius);
            if (el.shadowBlur > 0 && el.animType === "draw" && rawProgress < 1)
              ctx.shadowBlur = 0;
            ctx.stroke();
          } else {
            const totalPerimeter = el.width * 2 + el.height * 2;
            const drawLength = totalPerimeter * rawProgress;
            ctx.beginPath();
            ctx.moveTo(el.x, el.y);
            let currentLength = 0;
            let markerPos = { x: el.x, y: el.y };
            if (drawLength > currentLength) {
              const edgeDraw = Math.min(drawLength - currentLength, el.width);
              ctx.lineTo(el.x + edgeDraw, el.y);
              markerPos = { x: el.x + edgeDraw, y: el.y };
              currentLength += el.width;
            }
            if (drawLength > currentLength) {
              const edgeDraw = Math.min(drawLength - currentLength, el.height);
              ctx.lineTo(el.x + el.width, el.y + edgeDraw);
              markerPos = { x: el.x + el.width, y: el.y + edgeDraw };
              currentLength += el.height;
            }
            if (drawLength > currentLength) {
              const edgeDraw = Math.min(drawLength - currentLength, el.width);
              ctx.lineTo(el.x + el.width - edgeDraw, el.y + el.height);
              markerPos = {
                x: el.x + el.width - edgeDraw,
                y: el.y + el.height,
              };
              currentLength += el.width;
            }
            if (drawLength > currentLength) {
              const edgeDraw = Math.min(drawLength - currentLength, el.height);
              ctx.lineTo(el.x, el.y + el.height - edgeDraw);
              markerPos = { x: el.x, y: el.y + el.height - edgeDraw };
            }
            if (el.shadowBlur > 0 && el.animType === "draw" && rawProgress < 1)
              ctx.shadowBlur = 0;
            ctx.stroke();
            if (
              rawProgress < 1 &&
              isPlaying &&
              !isExporting &&
              el.animType === "draw"
            )
              drawMarker(ctx, markerPos.x, markerPos.y, viewport.scale);
          }
        } else if (el.type === "image" || el.type === "video") {
          ctx.save();
          ctx.beginPath();
          if (el.borderRadius && ctx.roundRect)
            ctx.roundRect(
              el.x,
              el.y,
              el.width * rawProgress,
              el.height,
              el.borderRadius
            );
          else ctx.rect(el.x, el.y, el.width * rawProgress, el.height);
          ctx.clip();
          if (el.type === "image") {
            const img = new window.Image();
            img.src = el.src;
            ctx.drawImage(img, el.x, el.y, el.width, el.height);
          } else {
            const videoEl = videoRefs.current[el.id];
            if (videoEl && videoEl.readyState >= 2)
              ctx.drawImage(videoEl, el.x, el.y, el.width, el.height);
          }
          ctx.restore();
          if (
            rawProgress < 1 &&
            isPlaying &&
            !isExporting &&
            el.animType === "draw"
          )
            drawMarker(
              ctx,
              el.x + el.width * rawProgress,
              el.y + el.height / 2,
              viewport.scale
            );
        } else if (el.type === "path" && el.points && el.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          const pointsToDraw = Math.max(
            1,
            Math.floor(rawProgress * el.points.length)
          );
          for (let i = 1; i < pointsToDraw; i++)
            ctx.lineTo(el.points[i].x, el.points[i].y);
          if (el.shadowBlur > 0 && el.animType === "draw" && rawProgress < 1)
            ctx.shadowBlur = 0;
          ctx.stroke();
          if (
            rawProgress < 1 &&
            isPlaying &&
            !isExporting &&
            pointsToDraw > 0 &&
            el.animType === "draw"
          )
            drawMarker(
              ctx,
              el.points[pointsToDraw - 1].x,
              el.points[pointsToDraw - 1].y,
              viewport.scale
            );
        }

        if (selectedElementId === el.id && !isExporting) {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 1 / viewport.scale;
          ctx.setLineDash([5 / viewport.scale, 5 / viewport.scale]);
          ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
          ctx.setLineDash([]);
          ctx.fillStyle = "#3b82f6";
          const handleSize = 8 / viewport.scale;
          ctx.fillRect(
            bounds.x + bounds.width - handleSize / 2,
            bounds.y + bounds.height - handleSize / 2,
            handleSize,
            handleSize
          );
        }
        ctx.restore();
      });

    if (
      projectSettings.aspectRatio === "9:16" &&
      projectSettings.showSafeZones &&
      !isExporting
    ) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.scale, viewport.scale);
      ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
      ctx.fillRect(0, canvasHeight - 200, canvasWidth, 200);
      ctx.fillRect(canvasWidth - 70, canvasHeight - 450, 70, 250);
      ctx.fillRect(0, 0, canvasWidth, 80);
      ctx.fillStyle = "#ef4444";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText("Danger Zone (App UI)", 10, canvasHeight - 180);
      ctx.restore();
    }

    if (currentPath && currentPath.length > 0) {
      ctx.save();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++)
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      ctx.stroke();
      ctx.restore();
    }

    if (snapLines.x !== null) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.scale, viewport.scale);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1 / viewport.scale;
      ctx.setLineDash([5 / viewport.scale, 5 / viewport.scale]);
      ctx.beginPath();
      ctx.moveTo(snapLines.x, 0);
      ctx.lineTo(snapLines.x, canvasHeight);
      ctx.stroke();
      ctx.restore();
    }
    if (snapLines.y !== null) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.scale, viewport.scale);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1 / viewport.scale;
      ctx.setLineDash([5 / viewport.scale, 5 / viewport.scale]);
      ctx.beginPath();
      ctx.moveTo(0, snapLines.y);
      ctx.lineTo(canvasWidth, snapLines.y);
      ctx.stroke();
      ctx.restore();
    }
  }, [
    time,
    elements,
    selectedElementId,
    isPlaying,
    isExporting,
    currentPath,
    viewport,
    projectSettings,
    canvasWidth,
    canvasHeight,
    snapLines,
  ]);

  const handleExport = (quality = "1080p", type = "local") => {
    if (isExporting) return;
    setShowExportModal(false);
    setIsExporting(true);
    setSelectedElementId(null);
    setTime(0);
    const oldViewport = { ...viewport };
    const renderDelay = type === "cloud" ? 2000 : 100;
    setViewport({ x: 0, y: 0, scale: 1 });

    setTimeout(() => {
      const canvas = canvasRef.current;
      const stream = canvas.captureStream(30);
      const options = { mimeType: "video/webm; codecs=vp9" };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch {
        recorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = `export-${quality}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        setIsExporting(false);
        setViewport(oldViewport);
      };
      recorder.start();
      setIsPlaying(true);
    }, renderDelay);
  };

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return {
      x: (screenX - viewport.x) / viewport.scale,
      y: (screenY - viewport.y) / viewport.scale,
      screenX,
      screenY,
    };
  };

  const checkResizeHandleHit = (x, y, el, ctx) => {
    if (
      selectedElementId !== el.id ||
      el.type === "audio" ||
      el.type === "camera" ||
      el.type === "scene" ||
      el.locked
    )
      return false;
    const bounds = getElementBounds(el, ctx);
    let hx = bounds.x + bounds.width;
    let hy = bounds.y + bounds.height;
    if (el.animType === "move") {
      let introDuration =
        el.introDuration !== undefined
          ? el.introDuration
          : Math.min(1500, el.animDuration);
      let rawProgress =
        introDuration > 0
          ? Math.min(1, Math.max(0, (time - el.animStart) / introDuration))
          : 1;
      let p = EASING_FUNCTIONS[el.easing || "linear"](rawProgress);
      hx += (el.motionX || 0) * p;
      hy += (el.motionY || 0) * p;
    }
    const tolerance = 12 / viewport.scale;
    return (
      x >= hx - tolerance &&
      x <= hx + tolerance &&
      y >= hy - tolerance &&
      y <= hy + tolerance
    );
  };

  const hitTest = (x, y, el) => {
    if (el.type === "audio" || el.type === "camera" || el.type === "scene")
      return false;
    const bounds = getElementBounds(el);
    let testX = x;
    let testY = y;
    if (el.animType === "move") {
      let introDuration =
        el.introDuration !== undefined
          ? el.introDuration
          : Math.min(1500, el.animDuration);
      let rawProgress =
        introDuration > 0
          ? Math.min(1, Math.max(0, (time - el.animStart) / introDuration))
          : 1;
      let p = EASING_FUNCTIONS[el.easing || "linear"](rawProgress);
      testX -= (el.motionX || 0) * p;
      testY -= (el.motionY || 0) * p;
    }
    return (
      testX >= bounds.x &&
      testX <= bounds.x + bounds.width &&
      testY >= bounds.y &&
      testY <= bounds.y + bounds.height
    );
  };

  const handleCanvasMouseDown = (e) => {
    const pos = getMousePos(e);
    if (e.button === 1 || activeTool === "hand") {
      setIsPanning(true);
      setPanStart({ x: pos.screenX - viewport.x, y: pos.screenY - viewport.y });
      return;
    }
    if (activeTool === "pen") {
      dragStartElementsRef.current = elements;
      setCurrentPath([{ x: pos.x, y: pos.y }]);
      setSelectedElementId(null);
      return;
    }
    const ctx = canvasRef.current.getContext("2d");
    if (selectedElementId) {
      const activeEl = elements.find((el) => el.id === selectedElementId);
      if (activeEl && checkResizeHandleHit(pos.x, pos.y, activeEl, ctx)) {
        dragStartElementsRef.current = elements;
        setIsResizing(true);
        setIsDragging(false);
        return;
      }
    }

    // Scene Hit Testing limits
    const scenes = [
      { animStart: 0 },
      ...elements
        .filter((e) => e.type === "scene")
        .sort((a, b) => a.animStart - b.animStart),
    ];
    let activeSceneStart = 0;
    let nextSceneStart = projectSettings.duration;
    for (let i = 0; i < scenes.length; i++) {
      if (time >= scenes[i].animStart) {
        activeSceneStart = scenes[i].animStart;
        nextSceneStart = scenes[i + 1]
          ? scenes[i + 1].animStart
          : projectSettings.duration;
      }
    }

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      // Only allow selecting items that belong to the active scene and are currently alive
      if (
        el.animStart < activeSceneStart ||
        el.animStart >= nextSceneStart ||
        time < el.animStart ||
        time > el.animStart + el.animDuration ||
        el.hidden
      )
        continue;

      if (hitTest(pos.x, pos.y, el) && !el.locked) {
        setSelectedElementId(el.id);
        dragStartElementsRef.current = elements;
        setIsDragging(true);
        let mx = 0,
          my = 0;
        if (el.animType === "move") {
          let introDuration =
            el.introDuration !== undefined
              ? el.introDuration
              : Math.min(1500, el.animDuration);
          let rawProgress =
            introDuration > 0
              ? Math.min(1, Math.max(0, (time - el.animStart) / introDuration))
              : 1;
          let p = EASING_FUNCTIONS[el.easing || "linear"](rawProgress);
          mx = (el.motionX || 0) * p;
          my = (el.motionY || 0) * p;
        }
        if (el.type === "path") setDragOffset({ x: pos.x, y: pos.y, mx, my });
        else
          setDragOffset({ x: pos.x - el.x - mx, y: pos.y - el.y - my, mx, my });
        return;
      }
    }
    setSelectedElementId(null);
  };

  const handleCanvasMouseMove = (e) => {
    const pos = getMousePos(e);
    if (isPanning) {
      setViewport((prev) => ({
        ...prev,
        x: pos.screenX - panStart.x,
        y: pos.screenY - panStart.y,
      }));
      return;
    }
    if (activeTool === "pen" && currentPath) {
      setCurrentPath([...currentPath, { x: pos.x, y: pos.y }]);
      return;
    }

    if (isResizing && selectedElementId) {
      setElements(
        elements.map((el) => {
          if (el.id !== selectedElementId) return el;
          if (
            el.type === "rect" ||
            el.type === "image" ||
            el.type === "video"
          ) {
            const newWidth = Math.max(20, pos.x - el.x);
            const newHeight =
              el.type === "image" || el.type === "video"
                ? newWidth * (el.height / el.width)
                : Math.max(20, pos.y - el.y);
            return { ...el, width: newWidth, height: newHeight };
          } else if (el.type === "circle") {
            const newRadius = Math.max(
              10,
              Math.sqrt(Math.pow(pos.x - el.x, 2) + Math.pow(pos.y - el.y, 2))
            );
            return { ...el, radius: newRadius };
          } else if (el.type === "text") {
            const newFontSize = Math.max(
              12,
              pos.y - el.y + (el.fontSize || 32)
            );
            return { ...el, fontSize: newFontSize };
          }
          return el;
        })
      );
      return;
    }

    if (isDragging && selectedElementId) {
      const activeEl = elements.find((e) => e.id === selectedElementId);
      let sX = null,
        sY = null;

      setElements(
        elements.map((el) => {
          if (
            el.id === selectedElementId &&
            el.type !== "audio" &&
            el.type !== "camera" &&
            el.type !== "scene" &&
            !el.locked
          ) {
            let newX = pos.x - dragOffset.x - (dragOffset.mx || 0);
            let newY = pos.y - dragOffset.y - (dragOffset.my || 0);

            const bounds = getElementBounds(
              el,
              canvasRef.current?.getContext("2d")
            );
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            const elCenterX = newX + bounds.width / 2;
            const elCenterY = newY + bounds.height / 2;

            if (Math.abs(elCenterX - centerX) < 15) {
              newX = centerX - bounds.width / 2;
              sX = centerX;
            }
            if (Math.abs(elCenterY - centerY) < 15) {
              newY = centerY - bounds.height / 2;
              sY = centerY;
            }

            if (el.type === "path") {
              const dx = newX - el.x;
              const dy = newY - el.y;
              return {
                ...el,
                points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              };
            }
            return { ...el, x: newX, y: newY };
          }
          return el;
        })
      );

      setSnapLines({ x: sX, y: sY });
      if (activeEl?.type === "path")
        setDragOffset({ ...dragOffset, x: pos.x, y: pos.y });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setSnapLines({ x: null, y: null });
    if (activeTool === "pen" && currentPath) {
      if (currentPath.length > 2) {
        const newEl = {
          id: generateId(),
          type: "path",
          points: currentPath,
          color: "#0f172a",
          animStart: time,
          animDuration: 5000,
          introDuration: 1500,
          outroDuration: 0,
          outroType: "fade",
          animType: "draw",
          rotation: 0,
          blendMode: "source-over",
          opacity: 1,
          shadowBlur: 0,
          locked: false,
          hidden: false,
        };
        const newElements = [...elements, newEl];
        setPast((p) => [...p, dragStartElementsRef.current || elements]);
        setElements(newElements);
        setFuture([]);
        setSelectedElementId(newEl.id);
      }
      setCurrentPath(null);
      setActiveTool("select");
      dragStartElementsRef.current = null;
    }
    if ((isDragging || isResizing) && dragStartElementsRef.current) {
      if (
        JSON.stringify(dragStartElementsRef.current) !==
        JSON.stringify(elements)
      ) {
        setPast((p) => [...p, dragStartElementsRef.current]);
        setFuture([]);
      }
      dragStartElementsRef.current = null;
    }
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleCanvasWheel = (e) => {
    e.preventDefault();
    const zoomFactor = Math.sign(e.deltaY) > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, viewport.scale * zoomFactor));
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const newX = mouseX - (mouseX - viewport.x) * (newScale / viewport.scale);
    const newY = mouseY - (mouseY - viewport.y) * (newScale / viewport.scale);
    setViewport({ x: newX, y: newY, scale: newScale });
  };

  const handleZoomIn = () =>
    setViewport((v) => ({ ...v, scale: Math.min(5, v.scale * 1.2) }));
  const handleZoomOut = () =>
    setViewport((v) => ({ ...v, scale: Math.max(0.1, v.scale / 1.2) }));
  const handleZoomReset = () => setViewport({ x: 0, y: 0, scale: 1 });

  const handleTrackMouseDown = (e, el) => {
    e.stopPropagation();
    setSelectedElementId(el.id);
    dragStartElementsRef.current = elements;
    const container = e.currentTarget.parentElement;
    const startX = e.clientX;
    const initialAnimStart = el.animStart;
    const handleMouseMove = (moveEvent) => {
      const rect = container.getBoundingClientRect();
      const deltaX = moveEvent.clientX - startX;
      const timeDelta =
        (deltaX / (rect.width / timelineZoom)) * projectSettings.duration;
      let newStart = initialAnimStart + timeDelta;
      newStart = Math.max(
        0,
        Math.min(
          newStart,
          projectSettings.duration - (el.type === "scene" ? 0 : el.animDuration)
        )
      );
      setElements((prev) =>
        prev.map((item) =>
          item.id === el.id ? { ...item, animStart: newStart } : item
        )
      );
    };
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (dragStartElementsRef.current) {
        setPast((p) => [...p, dragStartElementsRef.current]);
        setFuture([]);
        dragStartElementsRef.current = null;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTrackResizeMouseDown = (e, el, edge) => {
    e.stopPropagation();
    setSelectedElementId(el.id);
    dragStartElementsRef.current = elements;
    const container = e.currentTarget.parentElement.parentElement;
    const startX = e.clientX;
    const initialAnimStart = el.animStart;
    const initialAnimDuration = el.animDuration;
    const handleMouseMove = (moveEvent) => {
      const rect = container.getBoundingClientRect();
      const deltaX = moveEvent.clientX - startX;
      const timeDelta =
        (deltaX / (rect.width / timelineZoom)) * projectSettings.duration;

      if (edge === "right") {
        let newDuration = initialAnimDuration + timeDelta;
        newDuration = Math.max(
          100,
          Math.min(newDuration, projectSettings.duration - initialAnimStart)
        );
        setElements((prev) =>
          prev.map((item) =>
            item.id === el.id ? { ...item, animDuration: newDuration } : item
          )
        );
      } else if (edge === "left") {
        let newStart = initialAnimStart + timeDelta;
        let newDuration = initialAnimDuration - timeDelta;
        if (newDuration < 100) {
          newStart = initialAnimStart + initialAnimDuration - 100;
          newDuration = 100;
        }
        if (newStart < 0) {
          newDuration = initialAnimDuration + initialAnimStart;
          newStart = 0;
        }
        setElements((prev) =>
          prev.map((item) =>
            item.id === el.id
              ? { ...item, animStart: newStart, animDuration: newDuration }
              : item
          )
        );
      }
    };
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (dragStartElementsRef.current) {
        setPast((p) => [...p, dragStartElementsRef.current]);
        setFuture([]);
        dragStartElementsRef.current = null;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handlePropertyChange = (id, key, value) => {
    setElements(
      elements.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      )
    );
  };
  const handlePropertyBlur = () => {
    if (JSON.stringify(past[past.length - 1]) !== JSON.stringify(elements))
      commitHistory(elements);
  };

  const rulerMarks = [];
  for (let i = 0; i <= projectSettings.duration; i += 2000) rulerMarks.push(i);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
            W
          </div>
          <h1 className="font-semibold text-lg tracking-tight">
            Studio{" "}
            <span className="text-xs text-slate-400 font-normal ml-2">
              Enriched MVP
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-md p-1 border border-slate-200">
            <button
              onClick={handleNewProject}
              className="p-1.5 rounded text-slate-600 hover:bg-white hover:shadow-sm transition-all"
              title="New Project"
            >
              <FilePlus size={16} />
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <div
              className="relative group cursor-pointer p-1.5 rounded text-slate-600 hover:bg-white hover:shadow-sm transition-all"
              title="Open Project"
            >
              <input
                type="file"
                accept=".wbproj,.json"
                onChange={handleLoadProject}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FolderOpen size={16} />
            </div>
            <div
              className="relative group cursor-pointer p-1.5 rounded text-slate-600 hover:bg-white hover:shadow-sm transition-all"
              title="Import Project as Assets (Nesting)"
            >
              <input
                type="file"
                accept=".wbproj,.json"
                onChange={handleImportSubProject}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileUp size={16} />
            </div>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button
              onClick={handleSaveProject}
              className="p-1.5 rounded text-slate-600 hover:bg-white hover:shadow-sm transition-all"
              title="Save Project"
            >
              <Save size={16} />
            </button>
          </div>
          <div className="flex items-center bg-slate-100 rounded-md p-1 border border-slate-200">
            <button
              onClick={handleUndo}
              disabled={past.length === 0}
              className="p-1.5 rounded text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button
              onClick={handleRedo}
              disabled={future.length === 0}
              className="p-1.5 rounded text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Settings size={16} /> Settings
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white rounded-md transition-colors shadow-sm ${
              isExporting
                ? "bg-slate-400 cursor-wait"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </header>

      {/* Modals placed here instead of inside <main> so they correctly overlay everything */}
      {showSettings && (
        <div className="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-96 overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-semibold text-slate-800">Project Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Project Duration (ms)
                </label>
                <input
                  type="number"
                  value={projectSettings.duration}
                  onChange={(e) =>
                    setProjectSettings({
                      ...projectSettings,
                      duration: Math.max(
                        1000,
                        parseInt(e.target.value) || 1000
                      ),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Current: {projectSettings.duration / 1000}s{" "}
                  {projectSettings.aspectRatio === "9:16" &&
                    "(Max 60s for Shorts)"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Canvas Background Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={projectSettings.bgColor}
                    onChange={(e) =>
                      setProjectSettings({
                        ...projectSettings,
                        bgColor: e.target.value,
                      })
                    }
                    className="w-12 h-12 p-1 rounded border border-slate-300 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 font-mono">
                    {projectSettings.bgColor}
                  </span>
                </div>
              </div>
              {projectSettings.aspectRatio === "9:16" && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={projectSettings.showSafeZones || false}
                      onChange={(e) =>
                        setProjectSettings({
                          ...projectSettings,
                          showSafeZones: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    Show 9:16 UI Safe Zones
                  </label>
                  <p className="text-xs text-slate-500 mt-1 ml-6">
                    Displays an overlay showing where TikTok/Reels buttons
                    appear.
                  </p>
                </div>
              )}
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-96 overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-semibold text-slate-800">Export Video</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <button
                onClick={() => handleExport("720p", "local")}
                className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="text-left">
                  <h4 className="font-semibold text-sm text-slate-800">
                    Standard Proxy (720p)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fast local browser rendering.
                  </p>
                </div>
                <Download size={18} className="text-slate-400" />
              </button>
              <button
                onClick={() => handleExport("4k", "cloud")}
                className="w-full flex items-center justify-between p-3 border border-purple-200 bg-purple-50 rounded-lg hover:border-purple-400 hover:bg-purple-100 transition-colors"
              >
                <div className="text-left">
                  <h4 className="font-semibold text-sm text-purple-800 flex items-center gap-1">
                    Premium Cloud Render (4K) <CloudLightning size={14} />
                  </h4>
                  <p className="text-xs text-purple-600/80 mt-0.5">
                    Offload to servers. Highest quality.
                  </p>
                </div>
                <Download size={18} className="text-purple-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 z-10 shadow-sm overflow-y-auto scrollbar-hide">
          <ToolButton
            icon={<MousePointer2 size={20} />}
            active={activeTool === "select"}
            onClick={() => setActiveTool("select")}
            tooltip="Select (V)"
          />
          <ToolButton
            icon={<Hand size={20} />}
            active={activeTool === "hand"}
            onClick={() => setActiveTool("hand")}
            tooltip="Pan Canvas (H)"
          />
          <ToolButton
            icon={<PenTool size={20} />}
            active={activeTool === "pen"}
            onClick={() => setActiveTool("pen")}
            tooltip="Freehand Pen (P)"
          />
          <div className="w-8 h-px bg-slate-200 my-1 flex-shrink-0"></div>
          <ToolButton
            icon={<Type size={20} />}
            onClick={() => {
              setActiveTool("select");
              addElement("text");
            }}
            tooltip="Add Text (T)"
          />
          <ToolButton
            icon={<Square size={20} />}
            onClick={() => {
              setActiveTool("select");
              addElement("rect");
            }}
            tooltip="Add Rectangle (R)"
          />
          <ToolButton
            icon={<Circle size={20} />}
            onClick={() => {
              setActiveTool("select");
              addElement("circle");
            }}
            tooltip="Add Circle (C)"
          />
          <div className="w-8 h-px bg-slate-200 my-1 flex-shrink-0"></div>

          <ToolButton
            icon={<Clapperboard size={20} className="text-orange-500" />}
            onClick={() => {
              setActiveTool("select");
              addElement("scene");
            }}
            tooltip="Add Scene Break"
          />
          <ToolButton
            icon={<Captions size={20} className="text-emerald-600" />}
            onClick={generateAutoCaptions}
            tooltip="AI Auto-Captions (Mock)"
          />
          <ToolButton
            icon={<Video size={20} className="text-purple-600" />}
            onClick={() => {
              setActiveTool("select");
              addElement("camera");
            }}
            tooltip="Add Camera Pan"
          />

          <div className="w-8 h-px bg-slate-200 my-1 flex-shrink-0"></div>

          <div className="relative group p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer transition-all flex-shrink-0">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setActiveTool("select");
                handleImageUpload(e);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Import Image"
            />
            <ImageIcon size={20} />
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              Import Image
            </div>
          </div>

          <div className="relative group p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer transition-all flex-shrink-0">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                setActiveTool("select");
                handleVideoUpload(e);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Import Video"
            />
            <Film size={20} />
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              Import Video
            </div>
          </div>

          <div className="relative group p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer transition-all flex-shrink-0">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                setActiveTool("select");
                handleAudioUpload(e);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Import Audio"
            />
            <Music size={20} />
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              Import Audio
            </div>
          </div>

          <ToolButton
            icon={<Library size={20} />}
            active={showLibrary}
            onClick={() => setShowLibrary(!showLibrary)}
            tooltip="Asset Library"
          />
        </aside>

        <main
          className="flex-1 bg-slate-200 relative overflow-hidden flex flex-col items-center justify-center"
          ref={containerRef}
        >
          <div className="absolute top-4 flex bg-white/90 backdrop-blur shadow-sm rounded-lg p-1 border border-slate-200 z-30">
            <button
              onClick={() => handleAspectRatioChange("16:9")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                projectSettings.aspectRatio === "16:9"
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="YouTube / Standard Wide"
            >
              <Monitor size={14} /> 16:9
            </button>
            <button
              onClick={() => handleAspectRatioChange("9:16")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                projectSettings.aspectRatio === "9:16"
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Shorts / Reels / TikTok"
            >
              <Smartphone size={14} /> 9:16
            </button>
            <button
              onClick={() => handleAspectRatioChange("1:1")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                projectSettings.aspectRatio === "1:1"
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Instagram Feed Square"
            >
              <SquareIcon size={14} /> 1:1
            </button>
            <button
              onClick={() => handleAspectRatioChange("4:5")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                projectSettings.aspectRatio === "4:5"
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Facebook / Insta Portrait"
            >
              <Maximize2 size={14} /> 4:5
            </button>
          </div>

          <div
            className="bg-white shadow-lg border border-slate-300 overflow-hidden relative transition-all duration-300 ease-in-out"
            style={{ width: canvasWidth, height: canvasHeight }}
          >
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={handleCanvasWheel}
              className={`w-full h-full ${
                activeTool === "hand"
                  ? isPanning
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : isResizing
                  ? "cursor-se-resize"
                  : isDragging
                  ? "cursor-grabbing"
                  : "cursor-crosshair"
              }`}
            />

            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-lg flex flex-col items-center p-1 text-slate-600 z-20">
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-slate-100 hover:text-blue-600 rounded mb-1"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={handleZoomReset}
                className="p-1 hover:bg-slate-100 hover:text-blue-600 rounded text-[10px] font-bold"
                title="Reset Zoom"
              >
                {Math.round(viewport.scale * 100)}%
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-slate-100 hover:text-blue-600 rounded mt-1"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
            </div>
          </div>
        </main>

        <aside className="w-64 bg-white border-l border-slate-200 flex flex-col z-10 shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Layers size={16} className="text-slate-400" /> Properties
            </h2>
            {selectedElementId && (
              <div className="flex gap-1">
                <button
                  onClick={handleSplit}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Split at Playhead"
                >
                  <Scissors size={14} />
                </button>
                <button
                  onClick={handleDuplicate}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Duplicate Element (Ctrl+D)"
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {selectedElementId ? (
              <div className="space-y-4 text-sm pb-10">
                {elements
                  .filter((e) => e.id === selectedElementId)
                  .map((el) => (
                    <React.Fragment key={el.id}>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1 flex justify-between">
                          Type{" "}
                          {el.locked && (
                            <Lock size={12} className="text-red-500" />
                          )}
                        </label>
                        <div className="px-3 py-2 bg-slate-100 rounded capitalize text-slate-700 font-medium flex items-center justify-between">
                          {el.type === "camera"
                            ? "Camera Scene"
                            : el.type === "scene"
                            ? "Scene Break"
                            : el.type}
                          <button
                            onClick={() => {
                              handlePropertyChange(el.id, "locked", !el.locked);
                              commitHistory(
                                elements.map((item) =>
                                  item.id === el.id
                                    ? { ...item, locked: !el.locked }
                                    : item
                                )
                              );
                            }}
                            className="text-slate-400 hover:text-slate-600"
                            title={
                              el.locked ? "Unlock Element" : "Lock Element"
                            }
                          >
                            {el.locked ? (
                              <Lock size={14} className="text-red-500" />
                            ) : (
                              <Unlock size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Scene Break settings */}
                      {el.type === "scene" && (
                        <div className="bg-orange-50 border border-orange-100 rounded-md p-3">
                          <p className="text-xs text-orange-800 mb-3">
                            When the playhead passes this marker, the canvas is
                            wiped and starts fresh.
                          </p>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            New Background Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={el.bgColor || projectSettings.bgColor}
                              onChange={(e) =>
                                handlePropertyChange(
                                  el.id,
                                  "bgColor",
                                  e.target.value
                                )
                              }
                              onBlur={handlePropertyBlur}
                              className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                            />
                            <span className="text-slate-600 font-mono text-xs">
                              {el.bgColor || projectSettings.bgColor}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Content & Media settings */}
                      {el.type === "text" && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Content
                            </label>
                            <textarea
                              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={el.content}
                              onChange={(e) =>
                                handlePropertyChange(
                                  el.id,
                                  "content",
                                  e.target.value
                                )
                              }
                              onBlur={handlePropertyBlur}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                Font Size
                              </label>
                              <input
                                type="number"
                                value={el.fontSize || 32}
                                onChange={(e) =>
                                  handlePropertyChange(
                                    el.id,
                                    "fontSize",
                                    parseInt(e.target.value) || 32
                                  )
                                }
                                onBlur={handlePropertyBlur}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                Style
                              </label>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    const val =
                                      (el.fontWeight || "bold") === "bold"
                                        ? "normal"
                                        : "bold";
                                    handlePropertyChange(
                                      el.id,
                                      "fontWeight",
                                      val
                                    );
                                    commitHistory(
                                      elements.map((item) =>
                                        item.id === el.id
                                          ? { ...item, fontWeight: val }
                                          : item
                                      )
                                    );
                                  }}
                                  className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
                                    (el.fontWeight || "bold") === "bold"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  <Bold size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    const val =
                                      el.fontStyle === "italic"
                                        ? "normal"
                                        : "italic";
                                    handlePropertyChange(
                                      el.id,
                                      "fontStyle",
                                      val
                                    );
                                    commitHistory(
                                      elements.map((item) =>
                                        item.id === el.id
                                          ? { ...item, fontStyle: val }
                                          : item
                                      )
                                    );
                                  }}
                                  className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
                                    el.fontStyle === "italic"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  <Italic size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    const val =
                                      el.textDecoration === "underline"
                                        ? "none"
                                        : "underline";
                                    handlePropertyChange(
                                      el.id,
                                      "textDecoration",
                                      val
                                    );
                                    commitHistory(
                                      elements.map((item) =>
                                        item.id === el.id
                                          ? { ...item, textDecoration: val }
                                          : item
                                      )
                                    );
                                  }}
                                  className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
                                    el.textDecoration === "underline"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  <Underline size={14} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Font Family
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={el.fontFamily || "Inter, sans-serif"}
                              onChange={(e) => {
                                handlePropertyChange(
                                  el.id,
                                  "fontFamily",
                                  e.target.value
                                );
                                commitHistory(
                                  elements.map((item) =>
                                    item.id === el.id
                                      ? { ...item, fontFamily: e.target.value }
                                      : item
                                  )
                                );
                              }}
                            >
                              {FONTS.map((f) => (
                                <option key={f.value} value={f.value}>
                                  {f.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Text Alignment
                            </label>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  handlePropertyChange(
                                    el.id,
                                    "textAlign",
                                    "left"
                                  );
                                  commitHistory(
                                    elements.map((item) =>
                                      item.id === el.id
                                        ? { ...item, textAlign: "left" }
                                        : item
                                    )
                                  );
                                }}
                                className={`flex-1 py-1.5 flex items-center justify-center rounded transition-colors ${
                                  !el.textAlign || el.textAlign === "left"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <AlignLeft size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  handlePropertyChange(
                                    el.id,
                                    "textAlign",
                                    "center"
                                  );
                                  commitHistory(
                                    elements.map((item) =>
                                      item.id === el.id
                                        ? { ...item, textAlign: "center" }
                                        : item
                                    )
                                  );
                                }}
                                className={`flex-1 py-1.5 flex items-center justify-center rounded transition-colors ${
                                  el.textAlign === "center"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <AlignCenter size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  handlePropertyChange(
                                    el.id,
                                    "textAlign",
                                    "right"
                                  );
                                  commitHistory(
                                    elements.map((item) =>
                                      item.id === el.id
                                        ? { ...item, textAlign: "right" }
                                        : item
                                    )
                                  );
                                }}
                                className={`flex-1 py-1.5 flex items-center justify-center rounded transition-colors ${
                                  el.textAlign === "right"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <AlignRight size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded border border-slate-200">
                            <label className="block text-xs font-semibold text-slate-700 mb-2">
                              Text Highlighting & Outline
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                  Bg Color
                                </label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="color"
                                    value={el.textBgColor || "#ffffff"}
                                    onChange={(e) =>
                                      handlePropertyChange(
                                        el.id,
                                        "textBgColor",
                                        e.target.value
                                      )
                                    }
                                    onBlur={handlePropertyBlur}
                                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                                  />
                                  <button
                                    onClick={() => {
                                      handlePropertyChange(
                                        el.id,
                                        "textBgColor",
                                        ""
                                      );
                                      commitHistory(
                                        elements.map((i) =>
                                          i.id === el.id
                                            ? { ...i, textBgColor: "" }
                                            : i
                                        )
                                      );
                                    }}
                                    className="text-[10px] text-red-500 underline ml-1"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                  Outline Color
                                </label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="color"
                                    value={el.strokeColor || "#000000"}
                                    onChange={(e) =>
                                      handlePropertyChange(
                                        el.id,
                                        "strokeColor",
                                        e.target.value
                                      )
                                    }
                                    onBlur={handlePropertyBlur}
                                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                  Outline Thick
                                </label>
                                <input
                                  type="number"
                                  value={el.strokeWidth || 0}
                                  onChange={(e) =>
                                    handlePropertyChange(
                                      el.id,
                                      "strokeWidth",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  onBlur={handlePropertyBlur}
                                  className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Base Coloring */}
                      {el.type !== "image" &&
                        el.type !== "audio" &&
                        el.type !== "video" &&
                        el.type !== "camera" &&
                        el.type !== "scene" && (
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Color
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={el.color || "#000000"}
                                onChange={(e) =>
                                  handlePropertyChange(
                                    el.id,
                                    "color",
                                    e.target.value
                                  )
                                }
                                onBlur={handlePropertyBlur}
                                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                              />
                              <span className="text-slate-600 font-mono text-xs">
                                {el.color || "#000000"}
                              </span>
                            </div>
                          </div>
                        )}

                      {/* Advanced Media Color Grading Filters */}
                      {(el.type === "image" || el.type === "video") && (
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-3">
                          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <SlidersHorizontal size={14} /> Color Grading
                          </label>
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 mb-1">
                              Preset Filter
                            </label>
                            <select
                              className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                              value={el.presetFilter || ""}
                              onChange={(e) => {
                                handlePropertyChange(
                                  el.id,
                                  "presetFilter",
                                  e.target.value
                                );
                                commitHistory(
                                  elements.map((item) =>
                                    item.id === el.id
                                      ? {
                                          ...item,
                                          presetFilter: e.target.value,
                                        }
                                      : item
                                  )
                                );
                              }}
                            >
                              {FILTERS.map((f) => (
                                <option key={f.name} value={f.value}>
                                  {f.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                              <span>Brightness</span>{" "}
                              <span>{el.brightness ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={el.brightness ?? 100}
                              onChange={(e) =>
                                handlePropertyChange(
                                  el.id,
                                  "brightness",
                                  parseInt(e.target.value)
                                )
                              }
                              onMouseUp={handlePropertyBlur}
                              className="w-full accent-blue-600 h-1.5"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                              <span>Contrast</span>{" "}
                              <span>{el.contrast ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={el.contrast ?? 100}
                              onChange={(e) =>
                                handlePropertyChange(
                                  el.id,
                                  "contrast",
                                  parseInt(e.target.value)
                                )
                              }
                              onMouseUp={handlePropertyBlur}
                              className="w-full accent-blue-600 h-1.5"
                            />
                          </div>
                        </div>
                      )}

                      {/* Border Radius */}
                      {(el.type === "image" ||
                        el.type === "video" ||
                        el.type === "rect") && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center justify-between">
                            Corner Radius <span>{el.borderRadius || 0}px</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={el.borderRadius || 0}
                            onChange={(e) =>
                              handlePropertyChange(
                                el.id,
                                "borderRadius",
                                parseInt(e.target.value)
                              )
                            }
                            onMouseUp={handlePropertyBlur}
                            className="w-full accent-blue-600"
                          />
                        </div>
                      )}

                      {/* Video/Audio Trimming & Speed */}
                      {(el.type === "video" || el.type === "audio") && (
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-3">
                          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <FastForward size={14} /> Media Controls
                          </label>
                          {el.type === "audio" && (
                            <div>
                              <label className="block text-[10px] font-medium text-slate-500 mb-1 flex justify-between">
                                Volume{" "}
                                <span>
                                  {Math.round(
                                    (el.volume !== undefined ? el.volume : 1) *
                                      100
                                  )}
                                  %
                                </span>
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={el.volume !== undefined ? el.volume : 1}
                                onChange={(e) =>
                                  handlePropertyChange(
                                    el.id,
                                    "volume",
                                    parseFloat(e.target.value)
                                  )
                                }
                                onMouseUp={handlePropertyBlur}
                                className="w-full accent-blue-600 h-1.5"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 mb-1 mt-2">
                              Trim Start (ms)
                            </label>
                            <input
                              type="number"
                              value={el.trimStart || 0}
                              onChange={(e) =>
                                handlePropertyChange(
                                  el.id,
                                  "trimStart",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              onBlur={handlePropertyBlur}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* Base Visual Effects */}
                      {el.type !== "audio" &&
                        el.type !== "camera" &&
                        el.type !== "scene" && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center justify-between">
                                Opacity{" "}
                                <span>
                                  {Math.round(
                                    (el.opacity !== undefined
                                      ? el.opacity
                                      : 1) * 100
                                  )}
                                  %
                                </span>
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={
                                  el.opacity !== undefined ? el.opacity : 1
                                }
                                onChange={(e) =>
                                  handlePropertyChange(
                                    el.id,
                                    "opacity",
                                    parseFloat(e.target.value)
                                  )
                                }
                                onMouseUp={handlePropertyBlur}
                                className="w-full accent-blue-600"
                              />
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-200">
                              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                                <Droplet size={14} /> Drop Shadow
                              </label>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                    Blur
                                  </label>
                                  <input
                                    type="number"
                                    value={el.shadowBlur || 0}
                                    onChange={(e) =>
                                      handlePropertyChange(
                                        el.id,
                                        "shadowBlur",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    onBlur={handlePropertyBlur}
                                    className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                    Color
                                  </label>
                                  <input
                                    type="color"
                                    value={el.shadowColor || "#000000"}
                                    onChange={(e) =>
                                      handlePropertyChange(
                                        el.id,
                                        "shadowColor",
                                        e.target.value
                                      )
                                    }
                                    onBlur={handlePropertyBlur}
                                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                      {/* Core Animation Config */}
                      {el.type !== "audio" &&
                        el.type !== "camera" &&
                        el.type !== "scene" && (
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Intro Animation Effect
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={el.animType || "draw"}
                              onChange={(e) => {
                                handlePropertyChange(
                                  el.id,
                                  "animType",
                                  e.target.value
                                );
                                commitHistory(
                                  elements.map((item) =>
                                    item.id === el.id
                                      ? { ...item, animType: e.target.value }
                                      : item
                                  )
                                );
                              }}
                            >
                              <option value="draw">Draw / Typewriter</option>
                              <option value="fade">Fade In</option>
                              <option value="scale">Pop In (Scale)</option>
                              <option value="move">Motion Path (Move)</option>
                              <option value="particles">Magic Particles</option>
                            </select>
                          </div>
                        )}

                      {el.type !== "audio" &&
                        el.type !== "camera" &&
                        el.type !== "scene" && (
                          <>
                            <div className="mt-2">
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Blend Mode (Masking)
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={el.blendMode || "source-over"}
                                onChange={(e) => {
                                  handlePropertyChange(
                                    el.id,
                                    "blendMode",
                                    e.target.value
                                  );
                                  commitHistory(
                                    elements.map((item) =>
                                      item.id === el.id
                                        ? { ...item, blendMode: e.target.value }
                                        : item
                                    )
                                  );
                                }}
                              >
                                <option value="source-over">Normal</option>
                                <option value="multiply">
                                  Multiply (Darken)
                                </option>
                                <option value="screen">Screen (Lighten)</option>
                                <option value="overlay">Overlay</option>
                                <option value="source-in">
                                  Masking (Source In)
                                </option>
                                <option value="destination-in">
                                  Masking (Dest In)
                                </option>
                              </select>
                            </div>
                            <div className="mt-2">
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Rotation (deg)
                              </label>
                              <input
                                type="number"
                                value={el.rotation || 0}
                                onChange={(e) =>
                                  handlePropertyChange(
                                    el.id,
                                    "rotation",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                onBlur={handlePropertyBlur}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </>
                        )}

                      {el.type !== "scene" && (
                        <div className="grid grid-cols-2 gap-2 mt-4 border-t border-slate-200 pt-4">
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 mb-1">
                              Start Point (ms)
                            </label>
                            <input
                              type="number"
                              value={Math.round(el.animStart)}
                              onChange={(e) =>
                                handlePropertyChange(
                                  el.id,
                                  "animStart",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              onBlur={handlePropertyBlur}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 mb-1 font-bold text-blue-600">
                              Clip Lifespan (ms)
                            </label>
                            <input
                              type="number"
                              value={el.animDuration}
                              onChange={(e) =>
                                handlePropertyChange(
                                  el.id,
                                  "animDuration",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              onBlur={handlePropertyBlur}
                              className="w-full px-2 py-1.5 border border-blue-400 bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                            />
                          </div>

                          {el.type !== "audio" && el.type !== "camera" && (
                            <>
                              <div>
                                <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                  Intro Duration (ms)
                                </label>
                                <input
                                  type="number"
                                  value={
                                    el.introDuration !== undefined
                                      ? el.introDuration
                                      : Math.min(1500, el.animDuration)
                                  }
                                  onChange={(e) =>
                                    handlePropertyChange(
                                      el.id,
                                      "introDuration",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  onBlur={handlePropertyBlur}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                  Outro Duration (ms)
                                </label>
                                <input
                                  type="number"
                                  value={el.outroDuration || 0}
                                  onChange={(e) =>
                                    handlePropertyChange(
                                      el.id,
                                      "outroDuration",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  onBlur={handlePropertyBlur}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {el.type !== "audio" &&
                        el.type !== "camera" &&
                        el.type !== "scene" && (
                          <div className="mt-4">
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Layer Order
                            </label>
                            <div className="flex gap-2">
                              <button
                                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-600 flex items-center justify-center transition-colors"
                                onClick={() => {
                                  const idx = elements.findIndex(
                                    (item) => item.id === el.id
                                  );
                                  if (idx > 0) {
                                    const newEls = [...elements];
                                    [newEls[idx - 1], newEls[idx]] = [
                                      newEls[idx],
                                      newEls[idx - 1],
                                    ];
                                    commitHistory(newEls);
                                  }
                                }}
                                title="Move Up"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button
                                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-600 flex items-center justify-center transition-colors"
                                onClick={() => {
                                  const idx = elements.findIndex(
                                    (item) => item.id === el.id
                                  );
                                  if (idx < elements.length - 1) {
                                    const newEls = [...elements];
                                    [newEls[idx], newEls[idx + 1]] = [
                                      newEls[idx + 1],
                                      newEls[idx],
                                    ];
                                    commitHistory(newEls);
                                  }
                                }}
                                title="Move Down"
                              >
                                <ArrowDown size={16} />
                              </button>
                              <button
                                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-600 flex items-center justify-center transition-colors"
                                onClick={handleBringToFront}
                                title="Bring to Front"
                              >
                                <ChevronsUp size={16} />
                              </button>
                              <button
                                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-600 flex items-center justify-center transition-colors"
                                onClick={handleSendToBack}
                                title="Send to Back"
                              >
                                <ChevronsDown size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      <button
                        className="w-full mt-4 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium transition-colors border border-red-200"
                        onClick={handleDelete}
                      >
                        Delete{" "}
                        {el.type === "camera"
                          ? "Camera Pan"
                          : el.type === "scene"
                          ? "Scene Break"
                          : "Element"}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-2 p-4">
                <MousePointer2 size={32} className="opacity-50" />
                <p className="text-sm">
                  Select an element on the canvas or timeline to edit its
                  properties.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Timeline */}
      <footer className="h-64 bg-white border-t border-slate-200 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center px-4 py-2 border-b border-slate-200 bg-slate-50 justify-between">
          <div className="flex items-center gap-2 w-48">
            <button
              onClick={() => {
                setTime(0);
                setIsPlaying(false);
              }}
              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors"
              title="Stop & Rewind"
            >
              <div className="w-3 h-3 bg-slate-600 rounded-sm"></div>
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors shadow-sm"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 px-4 text-slate-500">
            <ZoomOut
              size={16}
              className="cursor-pointer hover:text-blue-600"
              onClick={() => setTimelineZoom((z) => Math.max(0.5, z - 0.25))}
            />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.25"
              value={timelineZoom}
              onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
              className="w-24 accent-blue-600 h-1.5"
            />
            <ZoomIn
              size={16}
              className="cursor-pointer hover:text-blue-600"
              onClick={() => setTimelineZoom((z) => Math.min(3, z + 0.25))}
            />
          </div>
        </div>

        {/* Timeline Tracks Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto relative bg-slate-100 flex">
          {/* Left fixed headers */}
          <div className="flex flex-col sticky left-0 z-30 bg-slate-50 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
            {elements.map((el, idx) => (
              <div
                key={`header-${el.id}`}
                className={`flex items-center px-3 gap-2 w-48 h-12 flex-shrink-0 border-b border-slate-200 ${
                  selectedElementId === el.id ? "bg-blue-50" : ""
                }`}
              >
                <span className="text-xs font-medium text-slate-500 w-4">
                  {idx + 1}
                </span>
                {el.type === "text" && (
                  <Type size={14} className="text-slate-400" />
                )}
                {el.type === "circle" && (
                  <Circle size={14} className="text-slate-400" />
                )}
                {el.type === "rect" && (
                  <Square size={14} className="text-slate-400" />
                )}
                {el.type === "image" && (
                  <ImageIcon size={14} className="text-slate-400" />
                )}
                {el.type === "video" && (
                  <Film size={14} className="text-slate-400" />
                )}
                {el.type === "path" && (
                  <PenTool size={14} className="text-slate-400" />
                )}
                {el.type === "audio" && (
                  <Music size={14} className="text-slate-400" />
                )}
                {el.type === "camera" && (
                  <Video size={14} className="text-purple-500" />
                )}
                {el.type === "scene" && (
                  <Clapperboard size={14} className="text-orange-500" />
                )}
                <span
                  className={`text-sm truncate capitalize flex-1 ${
                    el.hidden || el.muted
                      ? "text-slate-400 line-through"
                      : "text-slate-700"
                  }`}
                >
                  {el.type === "camera"
                    ? "Camera Scene"
                    : el.type === "scene"
                    ? "Scene Break"
                    : el.content || el.type}
                </span>

                {/* Track Header Controls */}
                <div className="flex gap-1">
                  {el.type !== "audio" &&
                    el.type !== "camera" &&
                    el.type !== "scene" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePropertyChange(el.id, "hidden", !el.hidden);
                          commitHistory(
                            elements.map((item) =>
                              item.id === el.id
                                ? { ...item, hidden: !el.hidden }
                                : item
                            )
                          );
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {el.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  {el.type === "audio" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePropertyChange(el.id, "muted", !el.muted);
                        commitHistory(
                          elements.map((item) =>
                            item.id === el.id
                              ? { ...item, muted: !el.muted }
                              : item
                          )
                        );
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {el.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePropertyChange(el.id, "locked", !el.locked);
                      commitHistory(
                        elements.map((item) =>
                          item.id === el.id
                            ? { ...item, locked: !el.locked }
                            : item
                        )
                      );
                    }}
                    className={`hover:text-slate-600 ${
                      el.locked ? "text-red-500" : "text-slate-400"
                    }`}
                  >
                    {el.locked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                </div>
              </div>
            ))}
            <div className="h-12 border-b border-slate-200 bg-slate-50 w-48 flex-shrink-0"></div>
          </div>

          {/* Scrollable Tracks */}
          <div
            className="flex-1 relative min-w-0"
            style={{ width: `${timelineZoom * 100}%`, minWidth: "800px" }}
          >
            {/* Timeline Ruler overlaying tracks */}
            <div className="absolute top-0 left-0 right-0 h-6 border-b border-slate-200 z-10 flex items-end pointer-events-none">
              {rulerMarks.map((mark) => (
                <div
                  key={mark}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${(mark / projectSettings.duration) * 100}%`,
                  }}
                >
                  <span className="text-[10px] text-slate-400 mb-0.5">
                    {mark / 1000}s
                  </span>
                  <div className="h-1.5 w-px bg-slate-300"></div>
                </div>
              ))}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-3 bg-red-500/20 border-l border-red-500 cursor-ew-resize z-20 hover:bg-red-500/40 mt-6"
              style={{
                left: `calc(${(time / projectSettings.duration) * 100}% - 1px)`,
              }}
              onMouseDown={(e) => {
                const container = e.currentTarget.parentElement;
                const updateTime = (moveEvent) => {
                  const rect = container.getBoundingClientRect();
                  const percent = Math.max(
                    0,
                    Math.min(1, (moveEvent.clientX - rect.left) / rect.width)
                  );
                  setTime(percent * projectSettings.duration);
                };
                const upListener = () => {
                  window.removeEventListener("mousemove", updateTime);
                  window.removeEventListener("mouseup", upListener);
                };
                window.addEventListener("mousemove", updateTime);
                window.addEventListener("mouseup", upListener);
              }}
            >
              <div className="absolute -top-3 -left-1.5 w-3 h-3 bg-red-500 rotate-45"></div>
            </div>

            <div className="flex flex-col mt-6">
              {elements.map((el) => {
                const isAudio = el.type === "audio";
                const isCamera = el.type === "camera";
                const isScene = el.type === "scene";
                const isSelected = selectedElementId === el.id;

                let trackBgClass = isSelected
                  ? "bg-blue-100 border-blue-400 text-blue-800"
                  : "bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300";
                if (isAudio)
                  trackBgClass = isSelected
                    ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                    : "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-200";
                if (isCamera)
                  trackBgClass = isSelected
                    ? "bg-purple-100 border-purple-400 text-purple-800"
                    : "bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-200";
                if (isScene)
                  trackBgClass = isSelected
                    ? "bg-orange-200 border-orange-500 text-orange-900 font-bold"
                    : "bg-orange-100 border-orange-400 text-orange-800 font-semibold";
                if (el.hidden || el.muted)
                  trackBgClass =
                    "bg-slate-100 border-slate-200 text-slate-400 opacity-60";

                return (
                  <div
                    key={el.id}
                    className="flex h-12 border-b border-slate-200 group bg-white"
                  >
                    <div
                      className="flex-1 relative cursor-pointer"
                      onClick={() => setSelectedElementId(el.id)}
                    >
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGgwdjQwaDFWMHoiIGZpbGw9IiNlMmU4ZjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-50"></div>
                      <div
                        className={`absolute top-2 bottom-2 rounded-md shadow-sm border text-xs font-medium px-2 flex items-center overflow-hidden transition-all hover:ring-2 ring-blue-400 ${trackBgClass} z-10 cursor-grab active:cursor-grabbing`}
                        style={{
                          left: `${
                            (el.animStart / projectSettings.duration) * 100
                          }%`,
                          width: `${
                            (el.animDuration / projectSettings.duration) * 100
                          }%`,
                        }}
                        onMouseDown={(e) => handleTrackMouseDown(e, el)}
                      >
                        <div className="w-full truncate pointer-events-none capitalize">
                          {isAudio
                            ? "Audio Track"
                            : isCamera
                            ? "Scene Pan/Zoom"
                            : isScene
                            ? "🎬 Screen Wipe / New Scene"
                            : `${el.animType || "draw"} Effect`}
                          {el.locked && " (Locked)"}
                        </div>
                        {isSelected && !el.locked && (
                          <>
                            <div
                              className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize bg-black/10 hover:bg-blue-500/50 transition-colors"
                              onMouseDown={(e) =>
                                handleTrackResizeMouseDown(e, el, "left")
                              }
                            ></div>
                            <div
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize bg-black/10 hover:bg-blue-500/50 transition-colors"
                              onMouseDown={(e) =>
                                handleTrackResizeMouseDown(e, el, "right")
                              }
                            ></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="h-12 border-b border-slate-200 flex bg-white">
                <div className="flex-1"></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ToolButton({ icon, active, onClick, tooltip }) {
  return (
    <button
      className={`p-2.5 rounded-lg transition-all relative group flex-shrink-0 ${
        active
          ? "bg-blue-100 text-blue-600 shadow-inner"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
      onClick={onClick}
      title={tooltip}
    >
      {icon}
      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
        {tooltip}
      </div>
    </button>
  );
}
