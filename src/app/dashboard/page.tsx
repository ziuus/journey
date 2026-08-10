"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap, CheckCircle2, AlertCircle, ArrowLeft, ArrowUpRight, Flame, Target
} from "lucide-react";
import type { RawRoadmapData } from "@/lib/storage";
import { computeDashboard, type DashboardState } from "@/lib/execution-recommendations";

export default function Dashboard() {
  const [data, setData] = useState<RawRoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<DashboardState | null>(null);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roadmap?userId=local_user`);
      const json = await res.json();
      setData(json);
      if (json.layers) {
        setDash(computeDashboard(json.layers));
      }
    } catch (err) {
      console.error("Failed to fetch roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRoadmap();
  }, []);

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
      if (newData.layers) {
        setDash(computeDashboard(newData.layers));
      }
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

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "var(--text-muted)", fontSize: "14px" }}>
        Calculating focus recommendations...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px 80px" }}>
      {/* Back & Header */}
      <div style={{ marginBottom: "32px" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "var(--text-muted)",
            textDecoration: "none",
            marginBottom: "16px",
          }}
        >
          <ArrowLeft size={14} /> Back to Overview
        </Link>
        <h1 style={{ fontSize: "32px", fontWeight: "700", letterSpacing: "-0.03em" }}>
          Execution Dashboard
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginTop: "4px" }}>
          Scored task priority queue to answer "What should I focus on right now?"
        </p>
      </div>

      {/* Grid Layout */}
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        {/* Today's Priority Recommendations */}
        <section
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "24px 28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <Zap size={18} color="var(--accent)" />
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Today's Focus</h2>
          </div>

          {!dash || dash.today.length === 0 ? (
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>No recommendations available.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {dash.today.map((rec, i) => {
                const item = rec.scored.item;
                const isDone = item.status === "done";

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "16px",
                      padding: "16px",
                      borderRadius: "8px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: "1" }}>
                      <button
                        onClick={() => toggleItem(item.id)}
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          border: isDone ? "none" : "2px solid var(--text-muted)",
                          background: isDone ? "var(--accent)" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          cursor: "pointer",
                          marginTop: "2px",
                          flexShrink: 0,
                        }}
                      >
                        {isDone && <CheckCircle2 size={14} />}
                      </button>

                      <div>
                        <div style={{ fontSize: "15px", fontWeight: "600", textDecoration: isDone ? "line-through" : "none" }}>
                          {item.title}
                        </div>
                        {item.next_action && (
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                            Next: {item.next_action}
                          </div>
                        )}
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                          {rec.reason}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                      Score: {rec.scored.score}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Two-Column Details View: High ROI & Blocked Items */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          {/* High ROI */}
          <section
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Flame size={18} color="var(--text-primary)" />
              <h2 style={{ fontSize: "16px", fontWeight: "600" }}>High Career ROI</h2>
            </div>

            {!dash || dash.highestROI.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>All high ROI goals completed!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {dash.highestROI.slice(0, 4).map((rec, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-secondary)",
                      fontSize: "13px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: "500" }}>{rec.item.title}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>{rec.item.priority || "high"}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Blocked / Prerequisite check */}
          <section
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <AlertCircle size={18} color="var(--text-primary)" />
              <h2 style={{ fontSize: "16px", fontWeight: "600" }}>Blocked Tasks</h2>
            </div>

            {!dash || dash.blocked.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No blocked items. Clear path ahead!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {dash.blocked.slice(0, 4).map((rec, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-secondary)",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ fontWeight: "500" }}>{rec.item.title}</div>
                    <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px" }}>
                      Blocked by: {rec.blockedBy.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
