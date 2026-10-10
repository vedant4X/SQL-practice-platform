"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

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

  const levels = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-8 bg-[var(--bg-base)] text-[var(--text-main)] transition-colors">
      <div className="border-b border-[var(--border-color)] pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
          SQL Learning Curriculum
        </h1>
        <p className="text-[var(--text-muted)] text-sm mt-1.5 leading-relaxed">
          Master relational database querying across 10 progressive levels. Every topic features authentic MySQL 8.4 & PostgreSQL 16 exercises.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {levels.map((levelNum) => {
            const levelTopics = topics.filter((t) => t.level === levelNum);
            if (levelTopics.length === 0) return null;

            return (
              <div key={levelNum} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                  <span className="rounded font-bold text-xs px-2 py-0.5 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--border-control)]">
                    Level {levelNum}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
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
                      className="flex flex-col justify-between rounded-xl glass glass-interactive p-4 transition shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-[var(--text-main)] text-sm">{topic.title}</h3>
                          {topic.isMastered && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-success)]">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Mastered
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                          {topic.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[var(--border-color)] mt-4 flex items-center justify-between">
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                          {topic.solvedCount}/{topic.questionCount} Solved
                        </span>
                        {topic.firstQuestionSlug ? (
                          <Link
                            href={`/mysql/practice/${topic.firstQuestionSlug}`}
                            className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition"
                          >
                            <span>Practice</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <span className="text-[11px] text-[var(--text-faint)] italic">
                            Coming Soon
                          </span>
                        )}
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
