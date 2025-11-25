// InfiniteDays.js – PIXEL PERFECT VERZIA (7 dní presne na šírku)
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";

const DAY_WIDTH_PERCENT = 14.2857; // presná šírka 1 dňa = 1/7

const InfiniteDays = ({ selectedDay, onSelect, targetWeek }) => {
  const scrollRef = useRef(null);
  const [currentWeekDays, setCurrentWeekDays] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const getWeekDays = (date) => {
    const d = new Date(date);
    const n = d.getDay();              // 0 = nedeľa, 1 = pondelok ...
    const iso = (n === 0 ? 7 : n);      // 1–7
    d.setDate(d.getDate() - (iso - 1)); // posun na pondelok

    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(d);
      x.setDate(d.getDate() + i);
      return x;
    });
  };


  const generateWeeksAround = (centerDate, weeksBefore = 10, weeksAfter = 10) => {
    const weeks = [];

    for (let i = weeksBefore; i > 0; i--) {
      const d = new Date(centerDate);
      d.setDate(d.getDate() - 7 * i);
      weeks.push(...getWeekDays(d));
    }

    weeks.push(...getWeekDays(centerDate));

    for (let i = 1; i <= weeksAfter; i++) {
      const d = new Date(centerDate);
      d.setDate(d.getDate() + 7 * i);
      weeks.push(...getWeekDays(d));
    }

    return weeks;
  };

  // pridáme funkciu scrollToWeek
  const scrollToWeek = (centerDate) => {
    const el = scrollRef.current;
    if (!el) return;

    const monday = getWeekDays(centerDate)[0];
    const targetIndex = currentWeekDays.findIndex(
      (d) => d.toDateString() === monday.toDateString()
    );
    if (targetIndex === -1) return;

    const containerWidth = el.clientWidth;
    const dayWidthPx = containerWidth * (DAY_WIDTH_PERCENT / 100);

    const targetOffset =
      targetIndex * dayWidthPx - containerWidth / 2 + dayWidthPx / 2;

    el.scrollTo({ left: targetOffset, behavior: "smooth" });
  };


  useEffect(() => {
    const today = new Date();
    const initialWeeks = generateWeeksAround(targetWeek || today, 10, 10);
    setCurrentWeekDays(initialWeeks);
    setIsInitialized(true);
  }, [targetWeek]);

  // Funkcia na pixel-perfect scroll na konkrétny dátum
  const scrollToDate = (date) => {
    const el = scrollRef.current;
    if (!el || currentWeekDays.length === 0) return;

    const targetDate = new Date(date);
    const targetIndex = currentWeekDays.findIndex(
      (d) => d.toDateString() === targetDate.toDateString()
    );
    if (targetIndex === -1) return;

    const containerWidth = el.clientWidth;
    const dayWidthPx = containerWidth * (DAY_WIDTH_PERCENT / 100);

    const targetOffset =
      targetIndex * dayWidthPx - containerWidth / 2 + dayWidthPx / 2;

    el.scrollTo({ left: targetOffset, behavior: "smooth" });
  };

  // Scroll na aktuálny týždeň alebo targetWeek
  useLayoutEffect(() => {
    if (!isInitialized) return;
    scrollToDate(targetWeek || new Date());
  }, [currentWeekDays, targetWeek, isInitialized]);

  // Scroll na vybraný deň, keď klikneš
  useLayoutEffect(() => {
    if (!selectedDay) return;
    scrollToDate(selectedDay);
  }, [selectedDay, currentWeekDays]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;

    if (scrollLeft > scrollWidth - clientWidth - 300) {
      const last = currentWeekDays[currentWeekDays.length - 1];
      const d = new Date(last);
      d.setDate(d.getDate() + 7);
      const newDays = generateWeeksAround(d, 0, 3);
      setCurrentWeekDays((prev) => [...prev, ...newDays]);
    }

    if (scrollLeft < 300) {
      const first = currentWeekDays[0];
      const d = new Date(first);
      d.setDate(d.getDate() - 7);
      const newDays = generateWeeksAround(d, 3, 0);

      const containerWidth = el.clientWidth;
      const dayWidthPx = containerWidth * (DAY_WIDTH_PERCENT / 100);

      setCurrentWeekDays((prev) => [...newDays, ...prev]);

      setTimeout(() => {
        el.scrollLeft += newDays.length * dayWidthPx;
      }, 0);
    }
  };


  const formatDayName = (d) =>
    d.toLocaleDateString("sk-SK", { weekday: "short" }).slice(0, 3);

  const isToday = (d) => d.toDateString() === new Date().toDateString();

  // SKELETON
  if (!isInitialized) {
    return (
      <div className="flex overflow-x-auto scrollbar-hide py-4 px-0">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 basis-[14.2857%] min-w-[14.2857%] max-w-[14.2857%]
            h-20 bg-gray-200 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex overflow-x-auto scrollbar-hide py-4 px-0"
      style={{
        scrollSnapType: "x mandatory",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      {currentWeekDays.map((day, i) => {
        const isSelected = selectedDay?.toDateString() === day.toDateString();
        const today = isToday(day);

        return (
          <button
            key={`${day.toISOString()}-${i}`}
            onClick={() => onSelect(day)}
            style={{ scrollSnapAlign: "center" }}
            className={`
              flex-shrink-0 basis-[14.2857%] min-w-[14.2857%] max-w-[14.2857%]
              transition-all duration-200 rounded-xl border-2 snap-center
              ${isSelected
                ? "border-blue-600 bg-blue-50 shadow-lg z-10"
                : today
                  ? "border-blue-500 bg-white shadow-md ring-2 ring-blue-100"
                  : "border-gray-200 bg-white shadow-sm hover:border-gray-300"
              }
            `}
          >
            <div className="py-2">
              <div
                className={`text-xs font-bold uppercase tracking-wider ${today || isSelected ? "text-blue-700" : "text-gray-500"
                  }`}
              >
                {formatDayName(day)}
              </div>
              <div
                className={`text-lg font-extrabold mt-1 ${today || isSelected ? "text-blue-700" : "text-gray-800"
                  }`}
              >
                {day.getDate()}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-medium">
                {day.toLocaleDateString("sk-SK", { month: "short" })}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default InfiniteDays;
