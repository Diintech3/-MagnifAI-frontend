import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  LuArrowLeft, 
  LuSparkles, 
  LuCheck, 
  LuActivity, 
  LuRefreshCw,
  LuCalendar,
  LuLightbulb,
  LuListTodo,
  LuClock,
  LuTrendingUp,
  LuTriangleAlert,
  LuInfo,
  LuChevronRight
} from "react-icons/lu";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";
import { useAuth } from "../../auth/AuthProvider";

export function AppDailyPlannerAnalysis() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse Date from query params
  const searchParams = new URLSearchParams(location.search);
  const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

  // State Management
  const [analysis, setAnalysis] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePaceTab, setActivePaceTab] = useState("P");
  const [analyzing, setAnalyzing] = useState(false);

  const basePath = location.pathname.startsWith("/ceo") ? "/ceo" : "/app";

  // Format Date for Display
  const getFormattedDate = (str) => {
    try {
      const parts = str.split("-");
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
    } catch (e) {
      return str;
    }
  };

  const getDayRatingTitle = (rate) => {
    if (rate >= 90) return "Excellent day overall";
    if (rate >= 70) return "Good day overall";
    if (rate >= 40) return "Moderate progress made";
    return "Action required today";
  };

  const getPacePillarData = (paceJson) => {
    if (!paceJson) return [];

    // 1. Priorities
    const prioritiesStatus = paceJson.priorities?.status || "Unknown";
    let prioritiesColorClass = "text-slate-500 bg-slate-50";
    let prioritiesProgress = 0;
    let prioritiesBarColor = "bg-slate-300";
    if (prioritiesStatus.toLowerCase().includes("aligned")) {
      prioritiesColorClass = "text-emerald-600 bg-emerald-50";
      prioritiesProgress = prioritiesStatus.toLowerCase().includes("partially") ? 60 : 100;
      prioritiesBarColor = "bg-emerald-500";
    } else {
      prioritiesColorClass = "text-rose-600 bg-rose-50";
      prioritiesProgress = 30;
      prioritiesBarColor = "bg-rose-500";
    }

    // 2. Allocation
    const allocationStatus = paceJson.allocation?.status || "Good";
    let allocationColorClass = "text-amber-600 bg-amber-50";
    let allocationProgress = 100;
    let allocationBarColor = "bg-amber-500";
    if (allocationStatus.toLowerCase().includes("good")) {
      allocationColorClass = "text-amber-600 bg-amber-50";
      allocationProgress = 100;
      allocationBarColor = "bg-amber-500";
    } else if (allocationStatus.toLowerCase().includes("fair")) {
      allocationColorClass = "text-amber-500 bg-amber-50/50";
      allocationProgress = 65;
      allocationBarColor = "bg-amber-400";
    } else {
      allocationColorClass = "text-rose-600 bg-rose-50";
      allocationProgress = 30;
      allocationBarColor = "bg-rose-500";
    }

    // 3. Control
    const controlStatus = paceJson.control?.status || "Moderate";
    let controlColorClass = "text-indigo-600 bg-indigo-50";
    let controlProgress = 60;
    let controlBarColor = "bg-indigo-500";
    if (controlStatus.toLowerCase().includes("high")) {
      controlColorClass = "text-indigo-600 bg-indigo-50";
      controlProgress = 100;
      controlBarColor = "bg-indigo-600";
    } else if (controlStatus.toLowerCase().includes("mod") || controlStatus.toLowerCase().includes("med")) {
      controlColorClass = "text-indigo-500 bg-indigo-50";
      controlProgress = 60;
      controlBarColor = "bg-indigo-500";
    } else {
      controlColorClass = "text-rose-600 bg-rose-50";
      controlProgress = 30;
      controlBarColor = "bg-rose-500";
    }

    // 4. Efficiency
    const efficiencyStatus = paceJson.efficiency?.status || "High Impact";
    let efficiencyColorClass = "text-blue-600 bg-blue-50";
    let efficiencyProgress = 100;
    let efficiencyBarColor = "bg-blue-500";
    if (efficiencyStatus.toLowerCase().includes("high")) {
      efficiencyColorClass = "text-blue-600 bg-blue-50";
      efficiencyProgress = 100;
      efficiencyBarColor = "bg-blue-500";
    } else if (efficiencyStatus.toLowerCase().includes("med") || efficiencyStatus.toLowerCase().includes("mod")) {
      efficiencyColorClass = "text-blue-500 bg-blue-50/70";
      efficiencyProgress = 60;
      efficiencyBarColor = "bg-blue-400";
    } else {
      efficiencyColorClass = "text-rose-600 bg-rose-50";
      efficiencyProgress = 30;
      efficiencyBarColor = "bg-rose-500";
    }

    return [
      {
        letter: "P",
        title: "Priorities",
        status: prioritiesStatus,
        colorClass: prioritiesColorClass,
        progress: prioritiesProgress,
        barColor: prioritiesBarColor
      },
      {
        letter: "A",
        title: "Allocation",
        status: allocationStatus,
        colorClass: allocationColorClass,
        progress: allocationProgress,
        barColor: allocationBarColor
      },
      {
        letter: "C",
        title: "Control",
        status: controlStatus,
        colorClass: controlColorClass,
        progress: controlProgress,
        barColor: controlBarColor
      },
      {
        letter: "E",
        title: "Efficiency",
        status: efficiencyStatus,
        colorClass: efficiencyColorClass,
        progress: efficiencyProgress,
        barColor: efficiencyBarColor
      }
    ];
  };

  // 1. Fetch Tasks & Existing Cached AI Analysis
  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // Load All Tasks (both pending/upcoming and completed) for metrics
      const [pendingData, completedData] = await Promise.all([
        api(`/api/root-agent/plans?filter=all`, { token }).catch(() => []),
        api(`/api/root-agent/plans?filter=completed`, { token }).catch(() => [])
      ]);
      
      const allPlans = [...(pendingData || []), ...(completedData || [])];
      const filtered = allPlans.filter(plan => plan.plan_date === dateStr);
      setTasks(filtered);

      // Load Cached AI Analysis
      const analysisData = await api(`/api/root-agent/plans/analyze?plan_date=${dateStr}`, { token });
      if (analysisData && analysisData.analysis_id) {
        setAnalysis(analysisData);
      } else {
        setAnalysis(null);
      }
    } catch (err) {
      console.warn("Failed to load cached analysis or tasks", err);
      // Don't toast error here because it's common to not have a cached analysis yet
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, dateStr]);

  // 2. Trigger AI Analysis (POST)
  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await api(`/api/root-agent/plans/analyze`, {
        method: "POST",
        token,
        body: { plan_date: dateStr }
      });
      if (res && res.analysis_id) {
        setAnalysis(res);
        // Reload tasks to make sure metrics match
        loadData(false);
      }
    } catch (err) {
      toastFromError(err, "Failed to run AI Analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  // Metrics Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.is_completed === true || t.status === "completed").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 font-sans pb-24">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`${basePath}/daily-planner`)}
            className="h-10 w-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <LuArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              {analysis && analysis.pace_json ? "Productivity" : "Daily Plan AI Insights"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-semibold flex items-center gap-1.5">
              {analysis && analysis.pace_json ? "Powered by PACE" : (
                <>
                  <LuCalendar className="h-3.5 w-3.5 text-slate-400" />
                  {getFormattedDate(dateStr)}
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-slate-700 shadow-xs font-semibold text-xs">
            <LuCalendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{getFormattedDate(dateStr)}</span>
          </div>
          {analysis && (
            <button
              disabled={analyzing}
              onClick={handleRunAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-xs transition font-semibold text-xs disabled:opacity-50 cursor-pointer hover:scale-[1.01]"
            >
              <LuRefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${analyzing ? "animate-spin" : ""}`} />
              {analyzing ? "Analyzing..." : "Re-run Analysis"}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Loading plan analysis...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Visual Metrics & Schedule Context */}
          <div className="space-y-6">
            
            {/* Completion Metrics Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-16 w-16 bg-indigo-50/40 rounded-bl-full flex items-center justify-center pr-2 pt-2">
                <LuActivity className="h-5 w-5 text-indigo-500" />
              </div>
              <h2 className="text-sm font-bold text-slate-700 mb-4">Completion Progress</h2>
              
              <div className="flex items-end gap-4">
                <span className="text-4xl font-extrabold text-slate-800">{completionRate}%</span>
                <span className="text-xs text-slate-400 font-bold mb-1">COMPLETION RATE</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              {/* Task Counts */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-100">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400">COMPLETED TASKS</span>
                  <span className="text-lg font-bold text-slate-700 mt-0.5">{completedTasks}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400">TOTAL TASKS</span>
                  <span className="text-lg font-bold text-slate-700 mt-0.5">{totalTasks}</span>
                </div>
              </div>
            </div>

            {/* List of Tasks in Scope */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
                <LuListTodo className="h-4 w-4 text-slate-500" />
                Schedule List
              </h2>
              {totalTasks === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 font-medium">
                  No plans or tasks scheduled for this day.
                </p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <div 
                      key={task.plan_id} 
                      className={`flex items-center gap-3 p-3 rounded-xl border border-slate-100 ${
                        task.is_completed ? "bg-slate-50/50" : "bg-white"
                      }`}
                    >
                      <LuCheck className={`h-4 w-4 flex-shrink-0 ${
                        task.is_completed ? "text-indigo-600 font-bold" : "text-slate-200"
                      }`} />
                      <div className="min-w-0 flex-1">
                        <span className={`block text-xs font-bold truncate ${
                          task.is_completed ? "line-through text-slate-400" : "text-slate-700"
                        }`}>
                          {task.title}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                          {task.plan_time} | {task.category ? (task.category.charAt(0).toUpperCase() + task.category.slice(1)) : "Task"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: AI Insights & Recommendation Cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* If no analysis exists yet */}
            {!analysis ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
                  <LuSparkles className="h-8 w-8 text-indigo-600 fill-indigo-100 animate-pulse" />
                </div>
                <h3 className="font-bold text-slate-700 text-lg">AI Analyzer Ready</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm font-medium">
                  {totalTasks === 0 
                    ? "Schedule some tasks on the calendar first, then trigger AI analysis to see insights."
                    : "No analysis has been generated for this date yet. Let AI analyze your schedule density, progress, and provide recommendations."}
                </p>
                {totalTasks > 0 && (
                  <button
                    disabled={analyzing}
                    onClick={handleRunAnalysis}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 transition text-sm disabled:opacity-50 mt-6 cursor-pointer hover:scale-[1.01]"
                  >
                    <LuSparkles className="h-4 w-4 text-amber-300 animate-bounce" />
                    {analyzing ? "Analyzing Day..." : "Run AI Analysis"}
                  </button>
                )}
              </div>
            ) : analysis.pace_json ? (
              <>
                {/* 1. PACE Pillar Cards Row (Clickable Tabs) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {getPacePillarData(analysis.pace_json).map((pillar, idx) => {
                    const isActive = activePaceTab === pillar.letter;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActivePaceTab(pillar.letter)}
                        className={`flex flex-col items-center text-center p-4 bg-white rounded-2xl border transition-all duration-200 cursor-pointer hover:scale-[1.01] ${
                          isActive 
                            ? "border-indigo-600 ring-2 ring-indigo-50/50 shadow-md" 
                            : "border-slate-100 shadow-xs hover:border-slate-200"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 shadow-xs ${pillar.colorClass}`}>
                          {pillar.letter}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{pillar.title}</span>
                        <span className="text-xs font-extrabold mt-1 text-slate-700">{pillar.status}</span>
                        <div className="w-16 bg-slate-100 h-1 rounded-full mt-2.5 overflow-hidden">
                          <div className={`h-1 rounded-full ${pillar.barColor}`} style={{ width: `${pillar.progress}%` }} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Overall Day Insight Card (circular score, summary) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                  {/* Score circle */}
                  <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        className="text-slate-100"
                        strokeWidth="7"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        className="text-emerald-500 transition-all duration-500 ease-out"
                        strokeWidth="7"
                        strokeDasharray={2 * Math.PI * 36}
                        strokeDashoffset={2 * Math.PI * 36 - (completionRate / 100) * (2 * Math.PI * 36)}
                        strokeLinecap="round"
                        fill="transparent"
                        stroke="currentColor"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-xl font-extrabold text-slate-800">{completionRate}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
                    </div>
                  </div>

                  {/* Rating, summary, & schedule details */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="absolute right-4 top-4 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <LuTrendingUp className="w-4.5 h-4.5" />
                    </div>

                    <h3 className="text-md font-extrabold text-slate-800">
                      {getDayRatingTitle(completionRate)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-semibold">
                      {analysis.summary}
                    </p>

                    {/* Scheduled and Open Time info */}
                    <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <LuClock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Scheduled</span>
                          <span className="text-xs font-extrabold text-slate-700">
                            {analysis.pace_json.allocation?.total_scheduled || "0h"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center flex-shrink-0">
                          <LuClock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Open Time</span>
                          <span className="text-xs font-extrabold text-slate-700">
                            {analysis.pace_json.allocation?.categories?.find(c => 
                              c.name.toLowerCase().includes("open") || 
                              c.name.toLowerCase().includes("unscheduled")
                            )?.duration || "0h 00m"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Where Time Went (Bar & Legend) */}
                {analysis.pace_json.allocation?.categories && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Where time went</h3>
                    
                    {/* Continuous progress bar */}
                    <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden mb-6 shadow-inner">
                      {analysis.pace_json.allocation.categories.map((cat, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            width: `${cat.percentage}%`, 
                            backgroundColor: cat.color || "#cbd5e1" 
                          }}
                          title={`${cat.name}: ${cat.duration} (${cat.percentage}%)`}
                        />
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      {analysis.pace_json.allocation.categories.map((cat, idx) => (
                        <div key={idx} className="flex flex-col items-start min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || "#cbd5e1" }} />
                            <span className="text-xs font-bold text-slate-600 truncate">{cat.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 mt-1 pl-4">{cat.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Active Tab Details Container */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
                  {/* Tab Header */}
                  {getPacePillarData(analysis.pace_json)
                    .filter(p => p.letter === activePaceTab)
                    .map((pillar, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${pillar.colorClass}`}>
                            {pillar.letter}
                          </div>
                          <div>
                            <h3 className="text-md font-extrabold text-slate-800">{pillar.title}</h3>
                            <p className="text-[10px] font-semibold text-slate-400">
                              {activePaceTab === "P" && "Did your day reflect what mattered most?"}
                              {activePaceTab === "A" && "Where did your scheduled time go?"}
                              {activePaceTab === "C" && "How intentionally was your day structured?"}
                              {activePaceTab === "E" && "How can the same time create more value?"}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${pillar.colorClass}`}>
                          {pillar.status}
                        </span>
                      </div>
                    ))}

                  {/* Tab Body */}
                  {activePaceTab === "P" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strong Alignment */}
                      <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <LuCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Strong Alignment</h4>
                          <p className="text-xs text-slate-600 font-semibold mt-1.5 leading-relaxed">
                            {analysis.pace_json.priorities?.strong_alignment || "Your primary tasks were fully aligned with development priorities."}
                          </p>
                        </div>
                      </div>
                      
                      {/* Biggest Gap */}
                      <div className="bg-amber-50/20 border border-amber-100/50 rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                          <LuTriangleAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider">Biggest Gap</h4>
                          <p className="text-xs text-slate-600 font-semibold mt-1.5 leading-relaxed">
                            {analysis.pace_json.priorities?.biggest_gap || "No significant gap observed."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePaceTab === "A" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <LuClock className="w-5 h-5 text-amber-500" />
                        <span className="text-sm font-extrabold text-slate-700">
                          Total Scheduled: {analysis.pace_json.allocation?.total_scheduled}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {analysis.pace_json.allocation?.categories?.map((cat, idx) => (
                          <div key={idx} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || "#cbd5e1" }} />
                                <span className="text-xs font-bold text-slate-700 truncate">{cat.name}</span>
                              </div>
                              <div className="text-xs font-bold text-slate-500 flex items-center gap-3">
                                <span>{cat.duration}</span>
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">{cat.percentage}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-1.5 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${cat.percentage}%`, 
                                  backgroundColor: cat.color || "#cbd5e1" 
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activePaceTab === "C" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Good */}
                      <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-2xl p-5 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <LuCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Good</h4>
                          <p className="text-xs text-slate-600 font-semibold mt-1 leading-relaxed">
                            {analysis.pace_json.control?.good || "Focus blocks protected."}
                          </p>
                        </div>
                      </div>
                      
                      {/* Watch Out */}
                      <div className="bg-amber-50/20 border border-amber-100/50 rounded-2xl p-5 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                          <LuTriangleAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider">Watch Out</h4>
                          <p className="text-xs text-slate-600 font-semibold mt-1 leading-relaxed">
                            {analysis.pace_json.control?.watch_out || "No major interruptions detected."}
                          </p>
                        </div>
                      </div>
                      
                      {/* Needs More */}
                      <div className="bg-blue-50/20 border border-blue-100/50 rounded-2xl p-5 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <LuInfo className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Needs More</h4>
                          <p className="text-xs text-slate-600 font-semibold mt-1 leading-relaxed">
                            {analysis.pace_json.control?.needs_more || "More focus blocks could improve flow."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePaceTab === "E" && (
                    <div className="space-y-3">
                      {((analysis.pace_json.efficiency?.actions || []).length > 0
                        ? analysis.pace_json.efficiency.actions
                        : (analysis.key_points || []).map((point, index) => ({ title: point, description: "" }))
                      ).map((action, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-55 border border-slate-100 rounded-2xl transition cursor-pointer group">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <LuLightbulb className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-700">{action.title}</h4>
                              {action.description && (
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{action.description}</p>
                              )}
                            </div>
                          </div>
                          <LuChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Permanent Key Recommendations Card */}
                {analysis.key_points && analysis.key_points.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <LuLightbulb className="h-4 w-4 text-amber-500 fill-amber-100" />
                      Key Recommendations & Actions
                    </h3>
                    
                    <div className="space-y-3.5">
                      {analysis.key_points.map((point, index) => (
                        <div 
                          key={index} 
                          className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50"
                        >
                          <span className="h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                            {point}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Permanent Day Insight Card */}
                <div className="bg-gradient-to-br from-violet-50/50 to-indigo-50/50 border border-violet-100 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                    <LuLightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-violet-800 uppercase tracking-wider">Day Insight</h4>
                    <p className="text-xs text-slate-600 font-semibold mt-2 leading-relaxed">
                      {analysis.pace_json.day_insight || analysis.pace_json.daily_insight || analysis.summary}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 1. Summary & Feedback Callout (Quote Style) */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-100">
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
                  
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md bg-white/10 text-indigo-200">
                    AI Feedback
                  </span>
                  
                  <h3 className="font-bold text-lg sm:text-xl text-white mt-4 leading-relaxed">
                    {analysis.feedback}
                  </h3>
                  
                  <p className="text-xs text-indigo-200/80 mt-3 font-medium border-l-2 border-indigo-500/60 pl-3.5 leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                {/* 2. Analytical Insight Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                    <LuActivity className="h-4 w-4 text-indigo-500" />
                    Workload & Density Analysis
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {analysis.analysis}
                  </p>
                </div>

                {/* 3. Key Recommendations / Action Points Checklist */}
                {analysis.key_points && analysis.key_points.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
                      <LuLightbulb className="h-4 w-4 text-amber-500 fill-amber-100" />
                      Key Recommendations & Actions
                    </h3>
                    
                    <div className="space-y-3.5">
                      {analysis.key_points.map((point, index) => (
                        <div 
                          key={index} 
                          className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50"
                        >
                          <span className="h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                            {point}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
