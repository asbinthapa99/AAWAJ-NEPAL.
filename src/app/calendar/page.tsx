import React from 'react';
import { Calendar as CalendarIcon, Sun, Cloud, Star, Gift, CalendarDays, TrendingUp, CloudSettings, FileText, RefreshCw, Bell } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-black pb-20">
      {/* Top Red Header Area */}
      <div className="bg-[#da1c22] text-white pt-6 pb-24 px-4 rounded-b-[2rem] relative shadow-lg">
        <div className="flex justify-between items-start mb-6 pt-2">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight mb-1">नेपाली पात्रो</h1>
            <p className="text-red-100 text-[13px] font-semibold tracking-wide">Nepali Calendar</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
             <div className="bg-white/20 p-2.5 rounded-full backdrop-blur-md">
               <CalendarIcon className="w-5 h-5 text-white" />
             </div>
          </div>
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-[44px] font-black tracking-tighter leading-none">२५</span>
              <span className="text-[22px] font-bold">चैत्र</span>
            </div>
            <p className="font-semibold text-red-50 text-[13px]">2081 BS • Tuesday</p>
            <p className="text-[11px] font-medium text-red-100 mt-0.5">March 11, 2026 AD</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <Sun className="w-12 h-12 text-yellow-300 mb-1.5 drop-shadow-md" fill="currentColor" />
            <p className="text-[22px] font-black tracking-tight">26°C</p>
            <p className="text-[12px] font-semibold text-red-100">Sunny</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 -mt-[4.5rem] relative z-10 max-w-[480px] mx-auto space-y-4">
        {/* Calendar Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-6 px-1">
            <h2 className="text-[19px] font-bold text-gray-900 dark:text-white">चैत्र २०८१</h2>
            <button className="text-[#da1c22] font-bold text-[13px]">View Full</button>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-5 mb-5 text-center px-1">
            {['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'].map((day) => (
              <div key={day} className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{day}</div>
            ))}
            
            {/* Mock Dates */}
            <div className="text-gray-300 dark:text-gray-600 font-semibold text-[15px] py-1">27</div>
            <div className="text-gray-300 dark:text-gray-600 font-semibold text-[15px] py-1">28</div>
            <div className="text-gray-300 dark:text-gray-600 font-semibold text-[15px] py-1">29</div>
            <div className="text-gray-300 dark:text-gray-600 font-semibold text-[15px] py-1">30</div>
            <div className="text-gray-300 dark:text-gray-600 font-semibold text-[15px] py-1">31</div>
            <div className="text-[#da1c22] font-bold bg-red-50 dark:bg-red-950/40 rounded-xl py-1 flex flex-col items-center justify-center border border-red-100 dark:border-red-900/50">
               <span className="text-[15px] leading-tight mt-0.5">1</span>
               <span className="text-[7px] font-bold leading-tight mt-0.5">होली</span>
            </div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 text-[15px] py-1">2</div>

            {[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map((d) => (
              <div key={d} className="font-semibold text-gray-800 dark:text-gray-200 text-[15px] py-1">{d}</div>
            ))}
            
            {/* Today */}
            <div className="bg-[#da1c22] text-white font-bold rounded-xl py-1 w-full flex items-center justify-center shadow-md text-[16px]">
              25
            </div>
            
            <div className="font-semibold text-gray-800 dark:text-gray-200 text-[15px] py-1">26</div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 text-[15px] py-1">27</div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 text-[15px] py-1">28</div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 text-[15px] py-1">29</div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 text-[15px] py-1">30</div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-2 text-[11px] font-bold text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#da1c22]"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900/50"></div>
              <span>Holiday</span>
            </div>
          </div>
        </div>

        {/* Panchang Section */}
        <h3 className="font-extrabold text-[17px] mt-6 mb-3 text-gray-900 dark:text-white px-1">आजको विवरण</h3>
        <div className="bg-[#fcfafa] dark:bg-zinc-900 p-4 rounded-3xl border border-orange-100/60 dark:border-zinc-800 shadow-sm">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white dark:bg-zinc-800 p-3.5 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700/50">
               <div className="flex items-center gap-2 mb-1.5">
                 <CalendarIcon className="w-4 h-4 text-[#da1c22]" />
                 <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">पञ्चाङ्ग</span>
               </div>
               <p className="font-bold text-gray-900 dark:text-white text-[15px]">तृतीया</p>
               <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">शुक्ल पक्ष</p>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-3.5 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700/50">
               <div className="flex items-center gap-2 mb-1.5">
                 <Star className="w-4 h-4 text-orange-500" />
                 <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">नक्षत्र</span>
               </div>
               <p className="font-bold text-gray-900 dark:text-white text-[15px]">रोहिणी</p>
               <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">शुभ मुहूर्त</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <div className="flex items-center gap-3.5 bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-gray-100 dark:border-zinc-700/50 shadow-sm">
                <div className="bg-orange-50 dark:bg-orange-500/10 p-2.5 rounded-[14px] text-orange-500">
                   <Sun className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">सूर्योदय</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">06:12 AM</p>
                </div>
             </div>
             <div className="flex items-center gap-3.5 bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-gray-100 dark:border-zinc-700/50 shadow-sm">
                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-[14px] text-indigo-500">
                   <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">सूर्यास्त</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">06:28 PM</p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
