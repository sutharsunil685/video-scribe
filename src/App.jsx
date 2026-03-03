import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

export default function App() {
  // --- State Management ---
  const [elements, setElements] = useState(() => {
    const saved = localStorage.getItem("whiteboard_elements");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 1,
        type: "text",
        content: "Welcome to the Whiteboard!",
        x: 200,
        y: 150,
        fontSize: 32,
        color: "#0f172a",
        animStart: 0,
        animDuration: 2000,
      },
      {
        id: 2,
        type: "circle",
        radius: 60,
        x: 200,
        y: 300,
        color: "#3b82f6",
        animStart: 2000,
        animDuration: 1500,
      },
      {
        id: 3,
        type: "rect",
        width: 120,
        height: 80,
        x: 400,
        y: 260,
        color: "#ef4444",
        animStart: 3500,
        animDuration: 1500,
      },
    ];
  });
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Drag & Resize State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem("whiteboard_elements", JSON.stringify(elements));
  }, [elements]);

  // Timeline State
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const maxTime = 6000; // 6 seconds timeline for MVP

  // Canvas Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // --- Animation Loop ---
  useEffect(() => {
    let req;
    if (isPlaying) {
      let lastT = performance.now();
      const loop = (t) => {
        const dt = t - lastT;
        lastT = t;
        setTime((prev) => {
          const nextTime = prev + dt;
          if (nextTime >= maxTime) {
            setIsPlaying(false);

            // Check if we are currently exporting and finish it
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === "recording"
            ) {
              mediaRecorderRef.current.stop();
            }

            return maxTime;
          }
          return nextTime;
        });
        req = requestAnimationFrame(loop);
      };
      req = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(req);
  }, [isPlaying, maxTime]);

  // --- Canvas Rendering Engine ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Elements
    elements.forEach((el) => {
      // Calculate animation progress (0.0 to 1.0)
      let progress = 0;
      if (time >= el.animStart + el.animDuration) {
        progress = 1;
      } else if (time > el.animStart) {
        progress = (time - el.animStart) / el.animDuration;
      }

      if (progress > 0) {
        ctx.save();
        ctx.strokeStyle = el.color || "#000";
        ctx.fillStyle = el.color || "#000";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Render based on type
        if (el.type === "text") {
          const charsToShow = Math.floor(progress * el.content.length);
          const textToDraw = el.content.substring(0, charsToShow);
          ctx.font = `bold ${el.fontSize || 32}px Inter, sans-serif`;
          ctx.fillText(textToDraw, el.x, el.y);

          if (progress < 1 && isPlaying && !isExporting) {
            const textMetrics = ctx.measureText(textToDraw);
            drawMarker(
              ctx,
              el.x + textMetrics.width + 5,
              el.y - (el.fontSize || 32) / 3
            );
          }
        } else if (el.type === "circle") {
          ctx.beginPath();
          ctx.arc(
            el.x,
            el.y,
            el.radius,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * progress
          );
          ctx.stroke();

          if (progress < 1 && isPlaying && !isExporting) {
            const markerX =
              el.x +
              Math.cos(-Math.PI / 2 + Math.PI * 2 * progress) * el.radius;
            const markerY =
              el.y +
              Math.sin(-Math.PI / 2 + Math.PI * 2 * progress) * el.radius;
            drawMarker(ctx, markerX, markerY);
          }
        } else if (el.type === "rect") {
          const totalPerimeter = el.width * 2 + el.height * 2;
          const drawLength = totalPerimeter * progress;

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
            markerPos = { x: el.x + el.width - edgeDraw, y: el.y + el.height };
            currentLength += el.width;
          }
          if (drawLength > currentLength) {
            const edgeDraw = Math.min(drawLength - currentLength, el.height);
            ctx.lineTo(el.x, el.y + el.height - edgeDraw);
            markerPos = { x: el.x, y: el.y + el.height - edgeDraw };
          }
          ctx.stroke();

          if (progress < 1 && isPlaying && !isExporting) {
            drawMarker(ctx, markerPos.x, markerPos.y);
          }
        } else if (el.type === "image") {
          ctx.save();
          ctx.beginPath();
          ctx.rect(el.x, el.y, el.width * progress, el.height);
          ctx.clip();

          const img = new window.Image();
          img.src = el.src;
          ctx.drawImage(img, el.x, el.y, el.width, el.height);
          ctx.restore();

          if (progress < 1 && isPlaying && !isExporting) {
            drawMarker(ctx, el.x + el.width * progress, el.y + el.height / 2);
          }
        }

        // Selection Highlight & Resize Handle (Hide during export)
        if (selectedElementId === el.id && !isExporting) {
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);

          let bounds = getElementBounds(el, ctx);

          // Draw bounding box
          ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
          ctx.setLineDash([]);

          // Draw resize handle (bottom right)
          ctx.fillStyle = "#3b82f6";
          ctx.fillRect(
            bounds.x + bounds.width - 4,
            bounds.y + bounds.height - 4,
            8,
            8
          );
        }

        ctx.restore();
      }
    });
  }, [time, elements, selectedElementId, isPlaying, isExporting]);

  // Helper to draw a fake "marker" hand
  const drawMarker = (ctx, x, y) => {
    ctx.save();
    ctx.fillStyle = "#f59e0b"; // Marker body
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 15, y - 30);
    ctx.lineTo(x + 25, y - 25);
    ctx.lineTo(x, y);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#000"; // Marker tip
    ctx.beginPath();
    ctx.arc(x + 2, y - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const getElementBounds = (el, ctx) => {
    if (el.type === "circle") {
      return {
        x: el.x - el.radius - 10,
        y: el.y - el.radius - 10,
        width: el.radius * 2 + 20,
        height: el.radius * 2 + 20,
      };
    } else if (el.type === "rect" || el.type === "image") {
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
      ctx.font = `bold ${el.fontSize || 32}px Inter, sans-serif`;
      const metrics = ctx.measureText(el.content);
      const fs = el.fontSize || 32;
      return {
        x: el.x - 10,
        y: el.y - fs - 10,
        width: metrics.width + 20,
        height: fs + 20,
      };
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  };

  // --- Export Logic ---
  const handleExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    setSelectedElementId(null);
    setTime(0);

    const canvas = canvasRef.current;
    const stream = canvas.captureStream(30); // 30 FPS

    // Use WebM as it's universally supported natively in modern browsers via MediaRecorder
    const options = { mimeType: "video/webm; codecs=vp9" };
    let recorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch (e) {
      recorder = new MediaRecorder(stream); // fallback
    }

    mediaRecorderRef.current = recorder;
    recordedChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style.display = "none";
      a.href = url;
      a.download = "whiteboard-animation.webm";
      a.click();
      window.URL.revokeObjectURL(url);
      setIsExporting(false);
    };

    recorder.start();
    setIsPlaying(true);
  };

  // --- Handlers ---
  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const checkResizeHandleHit = (x, y, el, ctx) => {
    if (selectedElementId !== el.id) return false;
    const bounds = getElementBounds(el, ctx);
    const hx = bounds.x + bounds.width - 4;
    const hy = bounds.y + bounds.height - 4;
    // 12px tolerance radius for clicking handle
    return x >= hx - 6 && x <= hx + 14 && y >= hy - 6 && y <= hy + 14;
  };

  const hitTest = (x, y, el) => {
    const bounds = getElementBounds(el);
    return (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    );
  };

  const handleCanvasMouseDown = (e) => {
    const pos = getMousePos(e);
    const ctx = canvasRef.current.getContext("2d");

    // Check resize handle first
    if (selectedElementId) {
      const activeEl = elements.find((el) => el.id === selectedElementId);
      if (activeEl && checkResizeHandleHit(pos.x, pos.y, activeEl, ctx)) {
        setIsResizing(true);
        setIsDragging(false);
        return;
      }
    }

    // Check element selection
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (hitTest(pos.x, pos.y, el)) {
        setSelectedElementId(el.id);
        setIsDragging(true);
        setDragOffset({ x: pos.x - el.x, y: pos.y - el.y });
        return;
      }
    }
    setSelectedElementId(null);
  };

  const handleCanvasMouseMove = (e) => {
    const pos = getMousePos(e);

    if (isResizing && selectedElementId) {
      setElements(
        elements.map((el) => {
          if (el.id !== selectedElementId) return el;

          if (el.type === "rect" || el.type === "image") {
            const newWidth = Math.max(20, pos.x - el.x);
            const newHeight =
              el.type === "image"
                ? newWidth * (el.height / el.width) // Maintain aspect ratio for images
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
      setElements(
        elements.map((el) =>
          el.id === selectedElementId
            ? { ...el, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
            : el
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleTrackMouseDown = (e, el) => {
    e.stopPropagation();
    setSelectedElementId(el.id);

    const container = e.currentTarget.parentElement;
    const startX = e.clientX;
    const initialAnimStart = el.animStart;

    const handleMouseMove = (moveEvent) => {
      const rect = container.getBoundingClientRect();
      const deltaX = moveEvent.clientX - startX;
      const timeDelta = (deltaX / rect.width) * maxTime;

      let newStart = initialAnimStart + timeDelta;
      newStart = Math.max(0, Math.min(newStart, maxTime - el.animDuration));

      setElements((prev) =>
        prev.map((item) =>
          item.id === el.id ? { ...item, animStart: newStart } : item
        )
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const addElement = (type) => {
    const newEl = {
      id: Date.now(),
      type,
      x: 300 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      color: "#0f172a",
      animStart: time,
      animDuration: 1500,
    };

    if (type === "text") {
      newEl.content = "New Text Element";
      newEl.fontSize = 32;
    }
    if (type === "circle") newEl.radius = 50;
    if (type === "rect") {
      newEl.width = 100;
      newEl.height = 100;
    }

    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const newEl = {
          id: Date.now(),
          type: "image",
          src: event.target.result,
          x: 300,
          y: 150,
          width: 200,
          height: 200 * (img.height / img.width),
          animStart: time,
          animDuration: 2000,
        };
        setElements((prev) => [...prev, newEl]);
        setSelectedElementId(newEl.id);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // --- UI Render ---
  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
            W
          </div>
          <h1 className="font-semibold text-lg tracking-tight">
            Whiteboard Studio{" "}
            <span className="text-xs text-slate-400 font-normal ml-2">
              Local PWA MVP
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <Settings size={16} /> Settings
          </button>
          <button
            onClick={handleExport}
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
            {isExporting ? "Exporting..." : "Export Video"}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 z-10 shadow-sm">
          <ToolButton
            icon={<MousePointer2 size={20} />}
            active={true}
            tooltip="Select (V)"
          />
          <div className="w-8 h-px bg-slate-200 my-1"></div>
          <ToolButton
            icon={<Type size={20} />}
            onClick={() => addElement("text")}
            tooltip="Add Text (T)"
          />
          <ToolButton
            icon={<Square size={20} />}
            onClick={() => addElement("rect")}
            tooltip="Add Rectangle (R)"
          />
          <ToolButton
            icon={<Circle size={20} />}
            onClick={() => addElement("circle")}
            tooltip="Add Circle (C)"
          />
          <div className="relative group p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer transition-all">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Import Image"
            />
            <ImageIcon size={20} />
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              Import Image
            </div>
          </div>
        </aside>

        {/* Canvas Area */}
        <main
          className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center"
          ref={containerRef}
        >
          <div
            className="bg-white shadow-md rounded-sm overflow-hidden border border-slate-200"
            style={{ width: 800, height: 450 }}
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className={`w-full h-full ${
                isResizing
                  ? "cursor-se-resize"
                  : isDragging
                  ? "cursor-grabbing"
                  : "cursor-crosshair"
              }`}
            />
          </div>

          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded shadow-sm text-sm font-mono text-slate-600 border border-slate-200">
            {(time / 1000).toFixed(2)}s / {(maxTime / 1000).toFixed(2)}s
          </div>

          {isExporting && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white px-6 py-4 rounded-lg shadow-xl border border-slate-200 text-center flex flex-col items-center">
                <Loader2
                  size={32}
                  className="animate-spin text-blue-600 mb-3"
                />
                <h3 className="font-semibold text-slate-800">
                  Rendering Video...
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Please do not close this tab.
                </p>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full"
                    style={{ width: `${(time / maxTime) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Properties Panel */}
        <aside className="w-64 bg-white border-l border-slate-200 flex flex-col z-10 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Layers size={16} className="text-slate-400" /> Properties
            </h2>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {selectedElementId ? (
              <div className="space-y-4 text-sm">
                {elements
                  .filter((e) => e.id === selectedElementId)
                  .map((el) => (
                    <React.Fragment key={el.id}>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          Type
                        </label>
                        <div className="px-3 py-2 bg-slate-100 rounded capitalize">
                          {el.type}
                        </div>
                      </div>
                      {el.type !== "image" && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={el.color || "#000000"}
                              onChange={(e) =>
                                setElements(
                                  elements.map((item) =>
                                    item.id === el.id
                                      ? { ...item, color: e.target.value }
                                      : item
                                  )
                                )
                              }
                              className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                            />
                            <span className="text-slate-600 font-mono text-xs">
                              {el.color || "#000000"}
                            </span>
                          </div>
                        </div>
                      )}
                      {el.type === "text" && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            Content
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={el.content}
                            onChange={(e) =>
                              setElements(
                                elements.map((item) =>
                                  item.id === el.id
                                    ? { ...item, content: e.target.value }
                                    : item
                                )
                              )
                            }
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          Animation Effect
                        </label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Draw / Typewriter</option>
                          <option>Fade In</option>
                          <option>Pop In</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            Start (ms)
                          </label>
                          <input
                            type="number"
                            value={Math.round(el.animStart)}
                            onChange={(e) =>
                              setElements(
                                elements.map((item) =>
                                  item.id === el.id
                                    ? {
                                        ...item,
                                        animStart:
                                          parseInt(e.target.value) || 0,
                                      }
                                    : item
                                )
                              )
                            }
                            className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            Duration (ms)
                          </label>
                          <input
                            type="number"
                            value={el.animDuration}
                            onChange={(e) =>
                              setElements(
                                elements.map((item) =>
                                  item.id === el.id
                                    ? {
                                        ...item,
                                        animDuration:
                                          parseInt(e.target.value) || 0,
                                      }
                                    : item
                                )
                              )
                            }
                            className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        className="w-full mt-4 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium transition-colors border border-red-200"
                        onClick={() => {
                          setElements(
                            elements.filter((item) => item.id !== el.id)
                          );
                          setSelectedElementId(null);
                        }}
                      >
                        Delete Element
                      </button>
                    </React.Fragment>
                  ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-2">
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
        {/* Timeline Controls */}
        <div className="flex items-center px-4 py-2 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 w-48">
            <button
              onClick={() => {
                setTime(0);
                setIsPlaying(false);
              }}
              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors"
            >
              <div className="w-3 h-3 bg-slate-600 rounded-sm"></div>{" "}
              {/* Stop Icon */}
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors shadow-sm"
            >
              {isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          </div>

          {/* Time Ruler */}
          <div className="flex-1 relative h-6">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300"></div>
            {[0, 1000, 2000, 3000, 4000, 5000, 6000].map((mark) => (
              <div
                key={mark}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${(mark / maxTime) * 100}%` }}
              >
                <div className="h-2 w-px bg-slate-400"></div>
                <span className="text-[10px] text-slate-500 mt-1">
                  {mark / 1000}s
                </span>
              </div>
            ))}
            {/* Playhead Head */}
            <div
              className="absolute top-0 bottom-0 w-3 bg-red-500/20 border-l border-red-500 cursor-ew-resize z-10 hover:bg-red-500/40"
              style={{ left: `calc(${(time / maxTime) * 100}% - 1px)` }}
              onMouseDown={(e) => {
                const container = e.currentTarget.parentElement;
                const updateTime = (moveEvent) => {
                  const rect = container.getBoundingClientRect();
                  const percent = Math.max(
                    0,
                    Math.min(1, (moveEvent.clientX - rect.left) / rect.width)
                  );
                  setTime(percent * maxTime);
                };
                const upListener = () => {
                  window.removeEventListener("mousemove", updateTime);
                  window.removeEventListener("mouseup", upListener);
                };
                window.addEventListener("mousemove", updateTime);
                window.addEventListener("mouseup", upListener);
              }}
            >
              <div className="absolute top-0 -left-1.5 w-3 h-3 bg-red-500 rotate-45"></div>
            </div>
          </div>
        </div>

        {/* Tracks Area */}
        <div className="flex-1 overflow-y-auto relative bg-slate-100">
          {/* Vertical Playhead Line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
            style={{
              left: `calc(12rem + ${(time / maxTime) * calcTimelineWidth()}px)`,
            }}
          />

          <div className="flex flex-col">
            {elements.map((el, idx) => (
              <div
                key={el.id}
                className="flex h-12 border-b border-slate-200 group bg-white"
              >
                {/* Track Header */}
                <div className="w-48 flex-shrink-0 bg-slate-50 border-r border-slate-200 flex items-center px-3 gap-2 relative z-20">
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
                  <span className="text-sm text-slate-700 truncate capitalize">
                    {el.content || el.type}
                  </span>
                </div>
                {/* Track Body */}
                <div
                  className="flex-1 relative cursor-pointer"
                  onClick={() => setSelectedElementId(el.id)}
                >
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGgwdjQwaDFWMHoiIGZpbGw9IiNlMmU4ZjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-50"></div>

                  {/* Keyframe Block */}
                  <div
                    className={`absolute top-2 bottom-2 rounded-md shadow-sm border text-xs font-medium px-2 flex items-center overflow-hidden transition-all hover:ring-2 ring-blue-400 ${
                      selectedElementId === el.id
                        ? "bg-blue-100 border-blue-400 text-blue-800 z-10"
                        : "bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300"
                    } cursor-grab active:cursor-grabbing`}
                    style={{
                      left: `${(el.animStart / maxTime) * 100}%`,
                      width: `${(el.animDuration / maxTime) * 100}%`,
                    }}
                    onMouseDown={(e) => handleTrackMouseDown(e, el)}
                  >
                    <div className="w-full truncate pointer-events-none">
                      Draw Effect
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="h-12 border-b border-slate-200 flex bg-white">
              <div className="w-48 bg-slate-50 border-r border-slate-200"></div>
              <div className="flex-1"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// UI Helper Components
function ToolButton({ icon, active, onClick, tooltip }) {
  return (
    <button
      className={`p-2.5 rounded-lg transition-all relative group ${
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

function calcTimelineWidth() {
  return typeof window !== "undefined" ? window.innerWidth - 192 : 1000;
}
