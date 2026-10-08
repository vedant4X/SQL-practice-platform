"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle, ArrowRight, Layers, Trophy } from "lucide-react";

interface TopicItem {
  id: string;
  level: number;
  title: string;
  slug: string;
  description: string;
  questionCount: number;
  solvedCount: number;
  isMastered: boolean;
  firstQuestionSlug: string | null;
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/topics")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setTopics(data.data.topics);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group topics by level
  const levels = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">SQL Learning Curriculum</h1>
        <p className="text-slate-400 text-sm mt-1">
          Master relational database querying across 10 progressive levels. Every topic features authentic PostgreSQL 16 exercises.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-800/50" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {levels.map((levelNum) => {
            const levelTopics = topics.filter((t) => t.level === levelNum);
            if (levelTopics.length === 0) return null;

            return (
              <div key={levelNum} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="rounded bg-primary/20 text-primary-light font-bold text-xs px-2.5 py-0.5">
                    Level {levelNum}
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    {levelNum === 1 && "Basics & Fundamentals"}
                    {levelNum === 2 && "Scalar & Aggregate Functions"}
                    {levelNum === 3 && "Grouping & Summaries"}
                    {levelNum === 4 && "Relational Joins"}
                    {levelNum === 5 && "Subqueries & Exists"}
                    {levelNum === 6 && "Set Operators"}
                    {levelNum === 7 && "Intermediate Constructs (CTEs, Views, Temp Tables)"}
                    {levelNum === 8 && "Window Functions & Frames"}
                    {levelNum === 9 && "Advanced Hierarchies & Query Plans"}
                    {levelNum === 10 && "Production Business Scenarios"}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {levelTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-background-card/40 p-4 hover:border-slate-700 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-white text-sm">{topic.title}</h3>
                          {topic.isMastered && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Mastered
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{topic.description}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-500">
                          {topic.solvedCount}/{topic.questionCount} Solved
                        </span>
                        <Link
                          href={`/practice/${topic.firstQuestionSlug || "view-all-departments"}`}
                          className="flex items-center gap-1 text-xs font-semibold text-primary-light hover:text-white transition"
                        >
                          <span>Start practice</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
