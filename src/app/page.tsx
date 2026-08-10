"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import {
  CheckCircle2, ChevronRight, ChevronUp, Search, ArrowUpRight
} from "lucide-react";
import type { RawRoadmapData } from "@/lib/storage";
import { collectTracks, filterLayersByTrack } from "@/lib/roadmap-utils";

export default function Home() {
  const [data, setData] = useState<RawRoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTrack, setActiveTrack] = useState<string>("");

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roadmap?userId=local_user`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRoadmap();
  }, []);

  const toggleLayerExpansion = (layerId: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const toggleItem = async (itemId: string) => {
    if (!data) return;
    const newData: RawRoadmapData = JSON.parse(JSON.stringify(data));
    let updated = false;

    for (const layer of newData.layers) {
      const item = layer.items.find((i) => i.id === itemId);
      if (item) {
        item.status = item.status === "done" ? "pending" : "done";
        updated = true;
        break;
      }
    }

    if (updated) {
      setData(newData);
      try {
        await fetch(`/api/roadmap?userId=local_user`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newData),
        });
      } catch (err) {
        console.error("Failed to sync changes:", err);
      }
    }
  };

  const trackLabels = useMemo(() => {
    if (!data) return ["Career & Tech"];
    return collectTracks(data.layers);
  }, [data]);

  const selectedTrack = trackLabels.includes(activeTrack) ? activeTrack : trackLabels[0];

  const currentLayers = useMemo(() => {
    if (!data) return [];
    return filterLayersByTrack(data.layers, selectedTrack);
  }, [data, selectedTrack]);

  const filteredLayers = useMemo(() => {
    return currentLayers.filter(
      (layer) =>
        layer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        layer.items.some((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [currentLayers, searchQuery]);

  const totalItems = data?.layers.reduce((acc, l) => acc + l.items.length, 0) || 0;
  const doneItems = data?.layers.reduce((acc, l) => acc + l.items.filter((i) => i.status === "done").length, 0) || 0;
  const progressPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "var(--text-muted)", fontSize: "14px" }}>
        Loading roadmap...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px 80px" }}>
      {/* Clean Minimal Hero Header */}
      <header style={{ marginBottom: "48px", textAlign: "center" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "700", letterSpacing: "-0.03em", marginBottom: "12px" }}>
          Journey
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "520px", margin: "0 auto 28px", lineHeight: "1.5" }}>
          Minimalist goal tracking for engineering, systems, and career growth.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--text-primary)",
              color: "var(--bg-primary)",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Dashboard <ArrowUpRight size={16} />
          </Link>
          <Link
            href="/tree"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              textDecoration: "none",
            }}
          >
            Goal Tree
          </Link>
        </div>
      </header>

      {/* Overview Metric Banner */}
      <section
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "24px 28px",
          marginBottom: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600", marginBottom: "4px" }}>
            Overall Mastery
          </div>
          <div style={{ fontSize: "32px", fontWeight: "700", letterSpacing: "-0.02em" }}>
            {progressPercent}% <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: "500" }}>({doneItems}/{totalItems} items completed)</span>
          </div>
        </div>

        <div style={{ flex: "1", maxWidth: "260px", minWidth: "180px" }}>
          <div style={{ height: "6px", background: "var(--bg-secondary)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPercent}%`, background: "var(--accent)", transition: "width 0.4s ease" }} />
          </div>
        </div>
      </section>

      {/* Controls & Track Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1", maxWidth: "340px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search goals & topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 36px",
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        {/* Track Pills */}
        <div className="no-scrollbar" style={{ display: "flex", gap: "6px", overflowX: "auto", maxWidth: "100%", scrollbarWidth: "none" }}>
          {trackLabels.map((track) => (
            <button
              key={track}
              onClick={() => setActiveTrack(track)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                border: "1px solid",
                borderColor: selectedTrack === track ? "var(--accent)" : "var(--border-color)",
                background: selectedTrack === track ? "var(--accent)" : "transparent",
                color: selectedTrack === track ? "var(--accent-fg)" : "var(--text-secondary)",
                fontWeight: selectedTrack === track ? "700" : "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              {track}
            </button>
          ))}
        </div>
      </div>

      {/* Roadmap Layers List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filteredLayers.map((layer) => {
          const isExpanded = expandedLayers.has(layer.id);
          const completedCount = layer.items.filter((i) => i.status === "done").length;
          const layerPercent = layer.items.length > 0 ? Math.round((completedCount / layer.items.length) * 100) : 0;

          return (
            <div
              key={layer.id}
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "20px 24px",
                transition: "border-color 0.2s ease",
              }}
            >
              {/* Header Row */}
              <div
                onClick={() => toggleLayerExpansion(layer.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
                    {layer.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                    {layer.description}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "500" }}>
                    {completedCount}/{layer.items.length} done ({layerPercent}%)
                  </span>
                  {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Items List (Expanded) */}
              {isExpanded && (
                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {layer.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        background: "var(--bg-secondary)",
                        cursor: "pointer",
                        opacity: item.status === "done" ? 0.6 : 1,
                        transition: "opacity 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: item.status === "done" ? "none" : "2px solid var(--text-muted)",
                          background: item.status === "done" ? "var(--accent)" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          flexShrink: 0,
                        }}
                      >
                        {item.status === "done" && <CheckCircle2 size={14} />}
                      </div>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          textDecoration: item.status === "done" ? "line-through" : "none",
                        }}
                      >
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
