"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap, CheckCircle2, Circle, AlertCircle, ArrowLeft, Flame, ListChecks, ChevronDown, ChevronRight
} from "lucide-react";
import type { RawRoadmapData } from "@/lib/storage";
import { computeDashboard, type DashboardState } from "@/lib/execution-recommendations";

export default function Dashboard() {
  const [data, setData] = useState<RawRoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<DashboardState | null>(null);
  const [expandedSubTasks, setExpandedSubTasks] = useState<Set<string>>(new Set());

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

  const toggleExpandSubTasks = (itemId: string) => {
    setExpandedSubTasks((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  /**
   * Toggle item or sub-task status via PATCH API.
   * Auto-syncs parent completion status & updates Dashboard recalculation.
   */
  const toggleItemStatus = async (itemId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === "done" ? "pending" : "done";
    try {
      const res = await fetch(`/api/roadmap/item?userId=local_user`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, updates: { status: nextStatus } }),
      });
      if (res.ok) {
        // Re-fetch updated roadmap data
        const freshRes = await fetch(`/api/roadmap?userId=local_user`);
        const json = await freshRes.json();
        setData(json);
        if (json.layers) {
          setDash(computeDashboard(json.layers));
        }
      }
    } catch (err) {
      console.error("Failed to toggle item status:", err);
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
          Scored task priority queue with interactive sub-task checklists to answer "What should I focus on right now?"
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
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {dash.today.map((rec, i) => {
                const item = rec.scored.item;
                const isDone = item.status === "done";
                const hasChildren = item.children && item.children.length > 0;
                const doneChildren = hasChildren ? item.children!.filter((c) => c.status === "done").length : 0;
                const totalChildren = hasChildren ? item.children!.length : 0;
                const isSubTasksExpanded = expandedSubTasks.has(item.id);

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      padding: "16px 20px",
                      borderRadius: "10px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: "1" }}>
                        <button
                          onClick={() => void toggleItemStatus(item.id, item.status)}
                          style={{
                            width: "22px",
                            height: "22px",
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
                          aria-label={`Mark ${item.title} as ${isDone ? "pending" : "done"}`}
                        >
                          {isDone && <CheckCircle2 size={15} />}
                        </button>

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "15.5px", fontWeight: "600", textDecoration: isDone ? "line-through" : "none" }}>
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

                          {/* Sub-Task Progress Indicator */}
                          {hasChildren && totalChildren > 0 && (
                            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px", maxWidth: "340px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", color: "var(--accent)" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <ListChecks size={13} /> {doneChildren}/{totalChildren} Sub-tasks
                                </span>
                                <span>{Math.round((doneChildren / totalChildren) * 100)}%</span>
                              </div>
                              <div style={{ width: "100%", height: "6px", background: "var(--border-color)", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{ height: "100%", background: "var(--accent)", width: `${(doneChildren / totalChildren) * 100}%`, transition: "width 0.3s ease" }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                          Score: {rec.scored.score}
                        </div>

                        {/* Expandable Sub-Tasks Toggle Button */}
                        {hasChildren && (
                          <button
                            onClick={() => toggleExpandSubTasks(item.id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              background: "var(--card-bg)",
                              color: "var(--text-secondary)",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                            title="Toggle sub-tasks checklist"
                          >
                            {isSubTasksExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            Sub-tasks
                          </button>
                        )}
                      </div>
                    </div>

                    {/* EXPANDABLE SUB-TASKS CHECKLIST ON DASHBOARD */}
                    {hasChildren && isSubTasksExpanded && (
                      <div
                        style={{
                          marginTop: "8px",
                          paddingTop: "12px",
                          borderTop: "1px dashed var(--border-color)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          paddingLeft: "34px",
                        }}
                      >
                        {item.children!.map((child) => {
                          const isChildDone = child.status === "done";
                          return (
                            <div
                              key={child.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                fontSize: "13.5px",
                                color: isChildDone ? "var(--text-muted)" : "var(--text-primary)",
                                textDecoration: isChildDone ? "line-through" : "none",
                              }}
                            >
                              <button
                                onClick={() => void toggleItemStatus(child.id, child.status)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  color: isChildDone ? "var(--accent)" : "var(--text-muted)",
                                }}
                                aria-label={`Toggle sub-task ${child.title}`}
                              >
                                {isChildDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                              </button>
                              <span>{child.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
