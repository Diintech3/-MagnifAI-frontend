import React, { useState, useEffect, useRef } from "react";
import { 
  LuCalendar, 
  LuClock, 
  LuPlus, 
  LuCheck, 
  LuTriangleAlert, 
  LuMapPin,
  LuActivity,
  LuSparkles,
  LuSettings
} from "react-icons/lu";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";


export function AppDailyPlanner() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const basePath = location.pathname.startsWith("/ceo") ? "/ceo" : "/app";
  
  // Date State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datesWindow, setDatesWindow] = useState([]);
  
  // UI Filters
  const [activeFilter, setActiveFilter] = useState("All");
  
  // Data States
  const [events, setEvents] = useState([]);
  const [carouselItems, setCarouselItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Plan Modal Form States
  const [showDrawer, setShowDrawer] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskCategory, setTaskCategory] = useState("Tasks");
  const [taskTime, setTaskTime] = useState("09:00");
  const [taskDate, setTaskDate] = useState("");
  const [taskDuration, setTaskDuration] = useState(30);
  const [taskIsRecurring, setTaskIsRecurring] = useState(false);
  
  // Conflict warning modal states
  const [conflictWarning, setConflictWarning] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // Generate 14-day dates window dynamically centered around selectedDate
  useEffect(() => {
    const baseDate = selectedDate || new Date();
    const isAlreadyVisible = datesWindow.some(d => isSameDay(d, baseDate));
    if (isAlreadyVisible && datesWindow.length === 14) return; // Don't shift if clicked date is already visible

    const arr = [];
    for (let i = -3; i <= 10; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      arr.push(d);
    }
    setDatesWindow(arr);
  }, [selectedDate]);

  // Set default form date to today on mount
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setTaskDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Run auto-complete once on mount or when token changes, then load initial events
  useEffect(() => {
    const runAutoCompleteAndLoad = async () => {
      if (!token) return;
      try {
        await api("/api/root-agent/plans/auto-complete", { method: "POST", token });
      } catch (err) {
        console.error("Auto-complete trigger failed", err);
      }
      loadCarousel();
      loadDailyEvents();
    };
    runAutoCompleteAndLoad();
  }, [token]);

  // Load events when date or active filter changes, but skip redundant loading on initial render
  const isFirstMount = useRef(true);
  const dateInputRef = useRef(null);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (token) {
      loadCarousel();
      loadDailyEvents();
    }
  }, [selectedDate, activeFilter]);

  const loadCarousel = async () => {
    try {
      const data = await api("/api/root-agent/plans/today", { token });
      if (data) {
        // Map today's plans list directly to carousel structures
        const items = data.map((p, idx) => {
          const timeParts = (p.plan_time || "09:00").split(":");
          let hr = Number(timeParts[0]);
          const ampm = hr >= 12 ? "PM" : "AM";
          hr = hr % 12 || 12;
          const formattedTime = `${String(hr).padStart(2, '0')}:${timeParts[1]} ${ampm}`;
          
          return {
            id: p.plan_id || `item_${idx}`,
            title: p.title || "Task",
            category: p.category || "General",
            time: formattedTime,
            starts_in: p.is_completed ? "Completed" : "Today",
            colors: (p.category || "").toLowerCase() === "ugc"
              ? ["#DDD6FE", "#C4B5FD"]
              : idx % 2 === 0 ? ["#FBCFE8", "#E9D5FF"] : ["#BFDBFE", "#A7F3D0"],
            border_color: (p.category || "").toLowerCase() === "ugc"
              ? "#8B5CF6"
              : idx % 2 === 0 ? "#D8B4FE" : "#6EE7B7"
          };
        });
        setCarouselItems(items);
      }
    } catch (e) {
      console.error("Failed to load carousel", e);
    }
  };

  const loadDailyEvents = async () => {
    setLoading(true);
    try {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const selectedDateStr = `${yyyy}-${mm}-${dd}`;

      // Fetch both pending/upcoming ("all") and completed plans to display them correctly across filters
      const [pendingData, completedData] = await Promise.all([
        api(`/api/root-agent/plans?filter=all`, { token }).catch(() => []),
        api(`/api/root-agent/plans?filter=completed`, { token }).catch(() => [])
      ]);
      
      const allPlans = [...(pendingData || []), ...(completedData || [])];
      const filtered = allPlans.filter(plan => plan.plan_date === selectedDateStr);
      setEvents(filtered);
    } catch (e) {
      toastFromError(e, "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Completion Patch API
  const handleToggleCompletion = async (planId) => {
    try {
      const res = await api(`/api/root-agent/plans/${planId}/complete`, {
        method: "PATCH",
        token
      });
      if (res && res.success) {
        const updated = res.plan || res;
        // Update local state
        setEvents(prev => prev.map(e => e.plan_id === planId ? { ...e, is_completed: updated.is_completed } : e));
        loadCarousel(); // Refresh header carousel
      }
    } catch (e) {
      toastFromError(e, "Failed to update completion status");
    }
  };

  // Edit Click Handler
  const handleEditClick = (plan) => {
    setEditingPlan(plan);
    setTaskTitle(plan.title || "");
    setTaskDesc(plan.description || "");
    
    // Map backend lowercase category to frontend display category
    const displayCategoryMap = {
      "meeting": "Meetings",
      "work": "Tasks",
      "reminder": "Reminder",
      "travel": "Travel",
      "ugc": "UGC"
    };
    const displayCategory = displayCategoryMap[plan.category] || "Tasks";
    setTaskCategory(displayCategory);
    
    setTaskTime(plan.plan_time || "09:00");
    setTaskDate(plan.plan_date || "");
    setTaskDuration(plan.duration_mins || 30);
    setTaskIsRecurring(plan.is_recurring || false);
    setConflictWarning(null);
    setShowDrawer(true);
  };

  // Submit Plan Flow
  const handleSubmitPlan = async (forceSave = false) => {
    if (!taskTitle.trim()) {
      alert("Please enter a task title");
      return;
    }

    setSubmitting(true);
    try {
      // Step A: Conflict check
      if (!forceSave) {
        let conflictUrl = `/api/root-agent/plans/check-conflict?plan_date=${taskDate}&plan_time=${taskTime}`;
        if (editingPlan) {
          conflictUrl += `&exclude_plan_id=${editingPlan.plan_id}`;
        }
        const conflictRes = await api(conflictUrl, { token });
        if (conflictRes && conflictRes.has_conflict) {
          setConflictWarning(conflictRes.conflicts[0]);
          setSubmitting(false);
          return;
        }
      }

      // Step B: Submit Event payload matching PDF exactly (normalize category to lowercase)
      const categoryMap = {
        "Meetings": "meeting",
        "Tasks": "work",
        "Reminder": "reminder",
        "Travel": "travel",
        "UGC": "ugc"
      };
      const apiCategory = categoryMap[taskCategory] || taskCategory.toLowerCase();

      const url = editingPlan 
        ? `/api/root-agent/plans/${editingPlan.plan_id}`
        : "/api/root-agent/plans";
      const method = editingPlan ? "PUT" : "POST";

      const res = await api(url, {
        method,
        token,
        body: {
          title: taskTitle,
          description: taskDesc,
          category: apiCategory,
          plan_date: taskDate,
          plan_time: taskTime,
          ...(apiCategory === "meeting" ? {
            duration_mins: Number(taskDuration),
            is_recurring: taskIsRecurring
          } : {})
        }
      });

      if (res && res.success) {
        setShowDrawer(false);
        setConflictWarning(null);
        setEditingPlan(null);
        
        // Reset form
        setTaskTitle("");
        setTaskDesc("");
        setTaskCategory("Tasks");
        setTaskDuration(30);
        setTaskIsRecurring(false);
        
        // Refresh views
        loadDailyEvents();
        loadCarousel();
      }
    } catch (e) {
      toastFromError(e, "Failed to create plan");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Events logic matching uppercase filters to lowercase category strings
  const filteredEvents = events.filter(e => {
    const isEventCompleted = e.is_completed === true || e.status === "completed";
    
    if (activeFilter === "Completed") {
      return isEventCompleted;
    }
    
    if (activeFilter === "All") return true;

    const cat = (e.category || "").toLowerCase();
    if (activeFilter === "Meetings") {
      return cat === "meeting" || cat === "meetings";
    }
    if (activeFilter === "Tasks") {
      return cat === "work" || cat === "tasks" || cat === "task" || cat === "personal";
    }
    if (activeFilter === "Reminder") {
      return cat === "reminder" || cat === "reminders" || cat === "health" || cat === "remin";
    }
    if (activeFilter === "Travel") {
      return cat === "travel";
    }
    if (activeFilter === "UGC") {
      return cat === "ugc";
    }
    return false;
  });

  const getFormatTime = (timeStr) => {
    if (!timeStr) return "09:00 AM";
    const parts = timeStr.split(":");
    let hr = Number(parts[0]);
    const min = parts[1] || "00";
    const ampm = hr >= 12 ? "PM" : "AM";
    hr = hr % 12 || 12;
    return `${String(hr).padStart(2, '0')}:${min} ${ampm}`;
  };

  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 font-sans pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <LuCalendar className="h-7 w-7 text-indigo-600" />
            My Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage your daily tasks, meetings, travel plans and check visual alerts.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const yyyy = selectedDate.getFullYear();
              const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const dd = String(selectedDate.getDate()).padStart(2, '0');
              const selectedDateStr = `${yyyy}-${mm}-${dd}`;
              navigate(`${basePath}/daily-planner/analysis?date=${selectedDateStr}`);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-800 rounded-xl shadow-xs transition font-semibold text-sm cursor-pointer border border-slate-200"
          >
            <LuSparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse fill-amber-100" />
            AI Insights
          </button>
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-200 transition font-semibold text-sm cursor-pointer"
          >
            <LuPlus className="h-4 w-4" />
            Plan My Day
          </button>
        </div>
      </div>

      {/* 1. Header Carousel Section */}
      {carouselItems.length > 0 && (
        <div className="mb-8">
          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-thin scrollbar-thumb-slate-200">
            {carouselItems.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  background: `linear-gradient(135deg, ${item.colors?.[0] || '#fbcfe8'}, ${item.colors?.[1] || '#e9d5ff'})`,
                  borderColor: item.border_color || '#d8b4fe'
                }}
                className="flex-shrink-0 w-64 p-4 rounded-2xl border shadow-sm relative overflow-hidden transition hover:-translate-y-0.5"
              >
                <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-white/20 blur-xl pointer-events-none" />
                
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/40 text-slate-700">
                  {item.category}
                </span>
                
                <h3 className="font-bold text-slate-800 text-sm mt-3 line-clamp-1">
                  {item.title}
                </h3>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <LuClock className="h-3 w-3" />
                    {item.time}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-900 bg-white/60 px-2 py-0.5 rounded-md">
                    {item.starts_in}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Horizontal Date Selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-3 px-2">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <LuClock className="h-4 w-4 text-indigo-500" />
            Select Date
          </h2>
          <button
            type="button"
            onClick={() => {
              if (dateInputRef.current) {
                try {
                  dateInputRef.current.showPicker();
                } catch (err) {
                  console.warn("showPicker fallback", err);
                  dateInputRef.current.focus();
                }
              }
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition cursor-pointer relative shadow-xs hover:scale-[1.01] active:scale-95"
          >
            <LuCalendar className="h-4 w-4 text-indigo-600" />
            <span>{selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <input 
              ref={dateInputRef}
              type="date"
              value={(() => {
                const yyyy = selectedDate.getFullYear();
                const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const dd = String(selectedDate.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
              })()}
              onChange={(e) => {
                if (e.target.value) {
                  // Parse date correctly considering timezones
                  const parts = e.target.value.split("-");
                  const newD = new Date(parts[0], parts[1] - 1, parts[2]);
                  setSelectedDate(newD);
                }
              }}
              className="absolute opacity-0 pointer-events-none w-0 h-0"
            />
          </button>
        </div>
        <div className="flex w-full gap-1.5 sm:gap-2 justify-between py-2 px-1 overflow-x-auto sm:overflow-x-visible scrollbar-none">
          {datesWindow.map((d, index) => {
            const isSelected = isSameDay(d, selectedDate);
            const isTodayDate = isSameDay(d, new Date());
            const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(d)}
                className={`flex-1 min-w-[42px] sm:min-w-0 h-16 rounded-xl flex flex-col items-center justify-center transition border cursor-pointer ${
                  isSelected 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                    : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span className={`text-[10px] font-bold ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                  {dayNames[d.getDay()]}
                </span>
                <span className="text-lg font-extrabold mt-0.5 leading-none">
                  {d.getDate()}
                </span>
                {isTodayDate && (
                  <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? "bg-white" : "bg-indigo-600"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Category Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
        {["All", "Meetings", "Tasks", "UGC", "Reminder", "Travel", "Completed"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition border cursor-pointer ${
              activeFilter === filter
                ? "bg-slate-800 border-slate-800 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* 4. Timeline Events Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-400">Loading schedule...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <LuCalendar className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-700 text-base">No Plans Scheduled</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[250px]">
              {activeFilter === "All" 
                ? "You have a clear day! Tap 'Plan My Day' to add tasks." 
                : `No tasks found in the category "${activeFilter}" for this date.`}
            </p>
          </div>
        ) : (
          <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6">
            {filteredEvents.map((plan) => {
              const categoryLower = String(plan.category || "").toLowerCase();
              
              let cardBg = "bg-[#EDFDF5]";
              let borderCol = "border-[#BBF7D0]";
              let textCol = "text-emerald-900";
              let labelBg = "bg-emerald-100 text-emerald-800";

              if (categoryLower === "meetings" || categoryLower === "work" || categoryLower === "meeting") {
                cardBg = "bg-[#FEFAF2]";
                borderCol = "border-[#FEF3C7]";
                textCol = "text-amber-900";
                labelBg = "bg-amber-100 text-amber-800";
              } else if (categoryLower === "reminder" || categoryLower === "health") {
                cardBg = "bg-[#FDF2F8]";
                borderCol = "border-[#FBCFE8]";
                textCol = "text-pink-900";
                labelBg = "bg-pink-100 text-pink-800";
              } else if (categoryLower === "travel") {
                cardBg = "bg-[#EFF6FF]";
                borderCol = "border-[#BFDBFE]";
                textCol = "text-blue-900";
                labelBg = "bg-blue-100 text-blue-800";
              } else if (categoryLower === "ugc") {
                cardBg = "bg-[#F5F3FF]";
                borderCol = "border-[#DDD6FE]";
                textCol = "text-violet-900";
                labelBg = "bg-violet-100 text-violet-800";
              }

              return (
                <div key={plan.plan_id} className="relative group">
                  <span className={`absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition ${
                    plan.is_completed ? "bg-slate-400" : "bg-indigo-600"
                  }`} />
                  
                  <div className={`p-4 rounded-2xl border shadow-sm transition hover:shadow-md ${cardBg} ${borderCol} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    plan.is_completed ? "opacity-60 grayscale-[30%]" : ""
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <LuClock className="h-3 w-3" />
                          {getFormatTime(plan.plan_time)}
                          {categoryLower === "meeting" && plan.duration_mins && (
                            <span className="text-slate-500 font-semibold"> ({plan.duration_mins} mins)</span>
                          )}
                          {categoryLower === "meeting" && plan.is_recurring && (
                            <span className="text-indigo-600 font-bold ml-1"> (Recurring)</span>
                          )}
                        </span>
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${labelBg}`}>
                          {plan.category ? (plan.category.charAt(0).toUpperCase() + plan.category.slice(1)) : "Task"}
                        </span>
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                          plan.status === "completed" || plan.is_completed ? "bg-slate-200 text-slate-700" :
                          plan.status === "upcoming" ? "bg-indigo-100 text-indigo-800" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {plan.status || (plan.is_completed ? "completed" : "pending")}
                        </span>
                      </div>
                      
                      <h4 className={`font-bold text-sm sm:text-base mt-2 ${textCol} ${
                        plan.is_completed || plan.status === "completed" ? "line-through text-slate-500" : ""
                      }`}>
                        {plan.title}
                      </h4>
                      
                      {plan.description && (
                        <p className="text-xs text-slate-500 mt-1 max-w-xl font-medium">
                          {plan.description}
                        </p>
                      )}

                      {(plan.from_meeting || plan.name || plan.device_id || plan.session_id) && (
                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                            <LuMapPin className="h-3 w-3" />
                            Meeting Scheduled via Chat
                          </span>
                          {plan.name && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              Name: {plan.name}
                            </span>
                          )}
                          {plan.device_id && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-150">
                              Device: {plan.device_id}
                            </span>
                          )}
                          {plan.session_id && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-150">
                              Session: {plan.session_id}
                            </span>
                          )}
                        </div>
                      )}

                      {plan.completed_at && (
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          Completed At: {new Date(plan.completed_at).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditClick(plan)}
                        className="h-8 w-8 rounded-full flex items-center justify-center border border-slate-200 bg-white text-slate-400 hover:border-indigo-500 hover:text-indigo-600 transition shadow-sm cursor-pointer"
                        title="Edit Plan"
                      >
                        <LuSettings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleCompletion(plan.plan_id)}
                        className={`h-8 w-8 rounded-full flex items-center justify-center border transition shadow-sm cursor-pointer ${
                          plan.is_completed 
                            ? "bg-slate-500 border-slate-500 text-white" 
                            : "bg-white border-slate-200 text-slate-400 hover:border-indigo-500 hover:text-indigo-600"
                        }`}
                      >
                        <LuCheck className="h-4.5 w-4.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Plan My Day Form Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            onClick={() => {
              setShowDrawer(false);
              setConflictWarning(null);
              setEditingPlan(null);
            }} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition" 
          />
          
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
              <LuActivity className="h-5 w-5 text-indigo-600" />
              {editingPlan ? "Edit Plan / Task" : "Plan Your Day"}
            </h2>

            {conflictWarning && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <LuTriangleAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="text-xs font-bold text-amber-800">⚠️ Schedule Conflict Warning</h4>
                  <p className="text-[11px] text-amber-600 mt-1 font-medium">
                    You already have <strong>"{conflictWarning.title}"</strong> scheduled within ±30 mins of this time.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => handleSubmitPlan(true)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Save Anyway
                    </button>
                    <button
                      onClick={() => setConflictWarning(null)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Adjust Time
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">TASK TITLE</label>
                <input
                  type="text"
                  placeholder="e.g., Campaign Review Meeting"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">DESCRIPTION</label>
                <textarea
                  placeholder="e.g., Online team video sync call..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">CATEGORY</label>
                <div className="flex flex-wrap gap-2">
                  {["Meetings", "Tasks", "UGC", "Reminder", "Travel"].map((cat) => {
                    const isSel = taskCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTaskCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          isSel 
                            ? "bg-amber-400 border-amber-400 text-slate-800" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">TIME</label>
                <input
                  type="time"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">DATE</label>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>

              {taskCategory === "Meetings" && (
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">MEETING DURATION (MINUTES)</label>
                    <select
                      value={taskDuration}
                      onChange={(e) => setTaskDuration(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>1 Hour</option>
                      <option value={90}>1.5 Hours</option>
                      <option value={120}>2 Hours</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={taskIsRecurring}
                      onChange={(e) => setTaskIsRecurring(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                    />
                    <label htmlFor="isRecurring" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                      Repeat Daily (Recurring Meeting)
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-100 pt-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDrawer(false);
                  setConflictWarning(null);
                  setEditingPlan(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmitPlan(false)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Saving..." : "Save Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
