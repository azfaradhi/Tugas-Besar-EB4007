'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Appointment {
  ID_jadwal: string;
  patient_name: string | null;
  ID_pasien: string | null;
  Date: string;
  Waktu_mulai: string;
  status: string;
  gedung_nama: string | null;
  ruangan_lantai: number | null;
}

interface DoctorScheduleCalendarProps {
  appointments: Appointment[];
}

export default function DoctorScheduleCalendar({ appointments }: DoctorScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(apt => {
      const aptDate = new Date(apt.Date);
      const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
      return aptDateStr === dateStr;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Terjadwal';
      case 'in_progress':
        return 'Berlangsung';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Create array of days to display
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null); // Empty cells before first day
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {monthNames[month]} {year}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={goToPreviousMonth}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
            >
              ← Prev
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
            >
              Hari Ini
            </button>
            <button
              onClick={goToNextMonth}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((dayName) => (
            <div
              key={dayName}
              className="text-center text-sm font-semibold text-gray-600 py-2"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayAppointments = getAppointmentsForDay(day);
            const hasAppointments = dayAppointments.length > 0;
            const isTodayDay = isToday(day);

            return (
              <div
                key={day}
                className={`
                  aspect-square border rounded-lg p-2 overflow-hidden hover:shadow-md transition
                  ${isTodayDay ? 'border-blue-500 bg-blue-50 border-2' : 'border-gray-200'}
                  ${hasAppointments ? 'bg-purple-50/50' : 'bg-white'}
                `}
              >
                <div className="h-full flex flex-col">
                  <div className={`text-sm font-semibold mb-1 ${isTodayDay ? 'text-blue-600' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="flex-1 space-y-1 overflow-y-auto">
                    {dayAppointments.map((apt) => (
                      <div
                        key={apt.ID_jadwal}
                        className="text-xs p-1 rounded bg-white border border-purple-200 hover:border-purple-400 cursor-pointer transition"
                        title={`${apt.patient_name || 'Pasien'} - ${apt.Waktu_mulai} - ${getStatusLabel(apt.status)}`}
                      >
                        <div className="font-medium text-gray-800 truncate">
                          {apt.Waktu_mulai.substring(0, 5)}
                        </div>
                        <div className="text-gray-600 truncate">
                          {apt.patient_name || '-'}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(apt.status)} inline-block`} />
                      </div>
                    ))}
                  </div>
                  {hasAppointments && (
                    <div className="text-xs text-purple-600 font-semibold mt-1">
                      {dayAppointments.length} jadwal
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Terjadwal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600">Berlangsung</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Selesai</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Dibatalkan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
