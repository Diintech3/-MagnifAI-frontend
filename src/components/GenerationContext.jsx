import { createContext, useContext, useState, useCallback, useRef } from "react";
import { api } from "../lib/api";
import { toastSuccess, toastFromError } from "../lib/toast";

const GenerationContext = createContext(null);

export function useGeneration() {
  return useContext(GenerationContext);
}

export function GenerationProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const jobIdRef = useRef(0);

  function updateJob(id, patch) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j));
  }

  // Returns jobs for a specific folderId
  function getJobsForFolder(folderId) {
    return jobs.filter(j => j.folderId === folderId);
  }

  const startGeneration = useCallback(async ({ token, form, onComplete }) => {
    const entries = Object.entries(form.typeConfig);
    const newJobs = [];

    for (const [contentType, count] of entries) {
      for (let i = 0; i < count; i++) {
        const id = ++jobIdRef.current;
        newJobs.push({
          id,
          contentType,
          topic: form.topic,
          folderId: form.folderId || null,
          status: "pending",
        });
      }
    }

    setJobs(prev => [...prev, ...newJobs]);

    let successCount = 0;

    for (const job of newJobs) {
      updateJob(job.id, { status: "running" });
      try {
        const { typeConfig, platforms, ...rest } = form;
        const data = await api("/api/app/content/generate", {
          method: "POST", token,
          body: {
            ...rest,
            platform: (platforms && platforms[0]) || form.platform || "LinkedIn",
            platforms: platforms || [],
            contentType: job.contentType,
            wordCount: Number(form.wordCount) || 1000,
            folderId: form.folderId || null,
            saveMode: "draft",
          },
        });
        updateJob(job.id, { status: "done", result: data.content });
        successCount++;
      } catch (e) {
        updateJob(job.id, { status: "error" });
        toastFromError(e, `Failed: ${job.contentType}`);
      }
    }

    if (successCount > 0) {
      toastSuccess(`✅ ${successCount} content${successCount > 1 ? "s" : ""} generated!`);
      if (onComplete) onComplete();
    }

    // Remove jobs for this batch
    setJobs(prev => prev.filter(j => !newJobs.find(nj => nj.id === j.id)));
  }, []);

  return (
    <GenerationContext.Provider value={{ startGeneration, getJobsForFolder }}>
      {children}
    </GenerationContext.Provider>
  );
}
