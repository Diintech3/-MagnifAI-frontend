import React, { useState, useEffect } from "react";
import { 
  LuCalendar, 
  LuClock, 
  LuPlus, 
  LuCheck, 
  LuTriangleAlert, 
  LuChevronRight, 
  LuChevronLeft,
  LuMapPin,
  LuInfo,
  LuActivity
} from "react-icons/lu";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";
import { useAuth } from "../../auth/AuthProvider";

export function AppDailyPlanner() {
  const { token } = useAuth();
  
  // Date State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datesWindow, setDatesWindow] = useState([]);
  
  // UI Filters
  const [activeFilter, setActiveFilter] = useState("All"); // All, Meetings, Tasks, Reminder, Travel
  
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
  
  // Conflict warning modal states
  const [conflictWarning, setConflictWarning] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Generate 14-day dates window dynamically (-3 days to +10 days around selected date/today)
  useEffect(() => {
    const today = new Date();
    const arr = [];
    for (let i = -3; i <= 10; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    setDatesWindow(arr);
    
    // Set default form date to today
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setTaskDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Fetch Carousel & Daily Events on Date change
  useEffect(() => {
    loadCarousel();
    loadDailyEvents();
  }, [selectedDate, token]);

  const loadCarousel = async () => {
    try {
      const data = await api("/api/v1/calendar/carousel", { token });
      if (data && data.success) {
        setCarouselItems(data.carousel_items || []);
      }
    } catch (e) {
      console.error("Failed to load carousel", e);
    }
  };

  const loadDailyEvents = async () => {
    setLoading(true);
    try {
      // Calculate start and end range for selected date
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const data = await api(
        `/api/v1/calendar/events?start_date=${startOfDay.toISOString()}&end_date=${endOfDay.toISOString()}`,
        { token }
      );
      if (data && data.success) {
        setEvents(data.events || []);
      }
    } catch (e) {
      toastFromError(e, "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Completion Patch API
  const handleToggleCompletion = async (id) => {
    try {
      const res = await api(`/api/v1/calendar/events/${id}/toggle`, {
        method: "PATCH",
        token
      });
      if (res && res.success) {
        // Toggle local state
        setEvents(prev => prev.map(e => e.id === id ? { ...e, is_completed: res.is_completed } : e));
        loadCarousel(); // Refresh header carousel
      }
    } catch (e) {
      toastFromError(e, "Failed to toggle completion status");
    }
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
        const conflictRes = await api(
          `/api/v1/calendar/check-conflict?plan_date=${taskDate}&plan_time=${taskTime}`,
          { token }
        );
        if (conflictRes && conflictRes.has_conflict) {
          setConflictWarning(conflictRes.conflicts[0]);
          setSubmitting(false);
          return;
        }
      }

      // Step B: Submit Event payload
      const startDateTimeStr = `${taskDate}T${taskTime}:00`;
      const res = await api("/api/v1/calendar/events", {
        method: "POST",
        token,
        body: {
          title: taskTitle,
          subtitle: taskDesc,
          category: taskCategory,
          start_time: startDateTimeStr
        }
      });

      if (res && res.success) {
        setShowDrawer(false);
        setConflictWarning(null);
        // Reset form
        setTaskTitle("");
        setTaskDesc("");
        setTaskCategory("Tasks");
        
        // Refresh views
        loadDailyEvents();
        loadCarousel();
      }
    } catch (e) {
      toastFromError(e, "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Events logic
  const filteredEvents = events.filter(e => {
    if (activeFilter === "All") return true;
    return e.category.toLowerCase() === activeFilter.toLowerCase();
  });

  const getFormatTime = (isoString) => {
    if (!isoString) return "09:00 AM";
    const d = new Date(isoString);
    let hr = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
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
        <button
          onClick={() => setShowDrawer(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-200 transition font-semibold text-sm cursor-pointer"
        >
          <LuPlus className="h-4 w-4" />
          Plan My Day
        </button>
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
                {/* Background glow animation decoration */}
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
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
            {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto py-2 px-1 scrollbar-none">
          {datesWindow.map((d, index) => {
            const isSelected = isSameDay(d, selectedDate);
            const isTodayDate = isSameDay(d, new Date());
            const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(d)}
                className={`flex-shrink-0 w-14 h-16 rounded-xl flex flex-col items-center justify-center transition border cursor-pointer ${
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
        {["All", "Meetings", "Tasks", "Reminder", "Travel"].map((filter) => (
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
            {filteredEvents.map((evt) => {
              // Custom colors based on category mappings
              const colorConfig = evt.metadata || { color: "#EDFDF5", border_color: "#BBF7D0" };
              const categoryLower = String(evt.category || "").toLowerCase();
              
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
              }

              return (
                <div key={evt.id} className="relative group">
                  {/* Timeline bullet node */}
                  <span className={`absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition ${
                    evt.is_completed ? "bg-slate-400" : "bg-indigo-600"
                  }`} />
                  
                  {/* Event Item content card */}
                  <div className={`p-4 rounded-2xl border shadow-sm transition hover:shadow-md ${cardBg} ${borderCol} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    evt.is_completed ? "opacity-60 grayscale-[30%]" : ""
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <LuClock className="h-3 w-3" />
                          {getFormatTime(evt.start_time)}
                        </span>
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${labelBg}`}>
                          {evt.category}
                        </span>
                      </div>
                      
                      <h4 className={`font-bold text-sm sm:text-base mt-2 ${textCol} ${
                        evt.is_completed ? "line-through text-slate-500" : ""
                      }`}>
                        {evt.title}
                      </h4>
                      
                      {evt.subtitle && (
                        <p className="text-xs text-slate-500 mt-1 max-w-xl font-medium">
                          {evt.subtitle}
                        </p>
                      )}

                      {evt.room_or_link && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 mt-2 bg-slate-100 px-2 py-0.5 rounded-md">
                          <LuMapPin className="h-3 w-3" />
                          {evt.room_or_link}
                        </span>
                      )}
                    </div>

                    {/* Completion checklist trigger toggle button */}
                    <button
                      onClick={() => handleToggleCompletion(evt.id)}
                      className={`h-8 w-8 rounded-full flex items-center justify-center border transition shadow-sm cursor-pointer ${
                        evt.is_completed 
                          ? "bg-slate-500 border-slate-500 text-white" 
                          : "bg-white border-slate-200 text-slate-400 hover:border-indigo-500 hover:text-indigo-600"
                      }`}
                    >
                      <LuCheck className="h-4.5 w-4.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Draw Modal Sheet: Plan My Day Form */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay mask */}
          <div 
            onClick={() => {
              setShowDrawer(false);
              setConflictWarning(null);
            }} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition" 
          />
          
          {/* Form container slideover */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
              <LuActivity className="h-5 w-5 text-indigo-600" />
              Plan Your Day
            </h2>

            {/* Conflict Warning Alerts Block */}
            {conflictWarning && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <LuTriangleAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="text-xs font-bold text-amber-800">⚠️ Schedule Conflict Warning</h4>
                  <p className="text-[11px] text-amber-600 mt-1 font-medium">
                    You already have <strong>"{conflictWarning.title}"</strong> scheduled within $\pm$30 mins of this time.
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
              {/* Task Title */}
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

              {/* Task Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">DESCRIPTION (SUBTITLE)</label>
                <textarea
                  placeholder="e.g., Online team video sync call..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50 resize-none"
                />
              </div>

              {/* Task Category Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">CATEGORY</label>
                <div className="flex flex-wrap gap-2">
                  {["Meetings", "Tasks", "Reminder", "Travel"].map((cat) => {
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

              {/* Time Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">TIME</label>
                <input
                  type="time"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">DATE</label>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-slate-100 pt-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDrawer(false);
                  setConflictWarning(null);
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
