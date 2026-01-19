import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, X } from 'lucide-react';

interface BlockOutPeriod {
  id: string;
  fromDate: string;
  toDate: string;
  reason?: string;
}

interface AvailabilitySettings {
  commitmentLevel: 'guaranteed' | 'best_effort' | 'remnant';
  minBookingLeadTime: string;
  campaignApprovalSLA: string;
  blockOutPeriods: BlockOutPeriod[];
}

interface InventoryAvailabilityCalendarProps {
  inventoryId: string;
  inventoryName: string;
  bookedDates?: string[]; // ISO date strings of booked dates
  onSettingsChange?: (settings: AvailabilitySettings) => void;
  initialSettings?: AvailabilitySettings;
  readOnly?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function InventoryAvailabilityCalendar({
  inventoryId,
  inventoryName,
  bookedDates = [],
  onSettingsChange,
  initialSettings,
  readOnly = false,
}: InventoryAvailabilityCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  
  const [settings, setSettings] = useState<AvailabilitySettings>(initialSettings || {
    commitmentLevel: 'guaranteed',
    minBookingLeadTime: '24_hours',
    campaignApprovalSLA: '4_business_hours',
    blockOutPeriods: [],
  });

  const [newBlockOut, setNewBlockOut] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
  });

  // Update settings when initialSettings loads asynchronously
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  // Calculate days in month
  const daysInMonth = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { date: Date | null; day: number | null }[] = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, day: null });
    }
    
    // Add all days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push({ 
        date: new Date(currentYear, currentMonth, i),
        day: i 
      });
    }
    
    return days;
  }, [currentMonth, currentYear]);

  const isDateBooked = (date: Date | null) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return bookedDates.includes(dateStr);
  };

  const isDateBlockedOut = (date: Date | null) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return settings.blockOutPeriods.some(period => {
      return dateStr >= period.fromDate && dateStr <= period.toDate;
    });
  };

  const isDatePast = (date: Date | null) => {
    if (!date) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    const dateStr = date.toISOString().split('T')[0];
    return dateStr < todayStr;
  };

  const getDayStatus = (date: Date | null) => {
    if (!date) return 'empty';
    if (isDatePast(date)) return 'past';
    if (isDateBooked(date) || isDateBlockedOut(date)) return 'blocked';
    return 'available';
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleAddBlockOut = () => {
    if (!newBlockOut.fromDate || !newBlockOut.toDate) return;
    
    const newPeriod: BlockOutPeriod = {
      id: Date.now().toString(),
      fromDate: newBlockOut.fromDate,
      toDate: newBlockOut.toDate,
      reason: newBlockOut.reason || undefined,
    };

    const updatedSettings = {
      ...settings,
      blockOutPeriods: [...settings.blockOutPeriods, newPeriod],
    };
    
    setSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
    setNewBlockOut({ fromDate: '', toDate: '', reason: '' });
  };

  const handleRemoveBlockOut = (id: string) => {
    const updatedSettings = {
      ...settings,
      blockOutPeriods: settings.blockOutPeriods.filter(p => p.id !== id),
    };
    setSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
  };

  const handleSettingChange = (key: keyof AvailabilitySettings, value: any) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50">
        <h2 className="text-xl font-bold text-secondary text-center">Manage Inventory Availability</h2>
        <p className="text-sm text-gray-500 text-center mt-1">Set when your inventory is available for booking</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <div>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-bold text-secondary">
                  {MONTHS[currentMonth]} {currentYear}
                </h3>
              </div>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((item, index) => {
                const status = getDayStatus(item.date);
                return (
                  <div
                    key={index}
                    className={`
                      aspect-square flex items-center justify-center text-sm font-medium rounded-lg
                      ${status === 'empty' ? '' : ''}
                      ${status === 'past' ? 'bg-gray-100 text-gray-400' : ''}
                      ${status === 'available' ? 'bg-green-100 text-green-800 border border-green-200' : ''}
                      ${status === 'blocked' ? 'bg-red-100 text-red-800 border border-red-200' : ''}
                    `}
                  >
                    {item.day}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-gray-600">Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                <span className="text-gray-600">Booked / Blocked</span>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-secondary">Availability Settings</h3>
            
            {/* Commitment Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inventory Commitment Level
              </label>
              <select
                value={settings.commitmentLevel}
                onChange={(e) => handleSettingChange('commitmentLevel', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
              >
                <option value="guaranteed">Guaranteed Supply (Committed)</option>
                <option value="best_effort">Best Effort</option>
                <option value="remnant">Remnant / Opportunistic</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {settings.commitmentLevel === 'guaranteed' && 'Guaranteed supply gives buyers booking confidence'}
                {settings.commitmentLevel === 'best_effort' && 'Best effort availability based on demand'}
                {settings.commitmentLevel === 'remnant' && 'Opportunistic fill for unsold inventory'}
              </p>
            </div>

            {/* Min Booking Lead Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Booking Lead Time
              </label>
              <select
                value={settings.minBookingLeadTime}
                onChange={(e) => handleSettingChange('minBookingLeadTime', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
              >
                <option value="no_lead">No minimum</option>
                <option value="24_hours">24 hours</option>
                <option value="48_hours">48 hours</option>
                <option value="72_hours">72 hours</option>
                <option value="1_week">1 week</option>
                <option value="2_weeks">2 weeks</option>
              </select>
            </div>

            {/* Campaign Approval SLA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Approval SLA
              </label>
              <select
                value={settings.campaignApprovalSLA}
                onChange={(e) => handleSettingChange('campaignApprovalSLA', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
              >
                <option value="auto_approve">Auto-approve all</option>
                <option value="1_business_hour">1 business hour</option>
                <option value="4_business_hours">4 business hours</option>
                <option value="24_hours">24 hours</option>
                <option value="48_hours">48 hours</option>
              </select>
            </div>

            {/* Block Out Dates */}
            {!readOnly && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Block Out Dates
                </label>
                <p className="text-xs text-gray-500 mb-3">Mark dates when inventory is unavailable</p>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From Date</label>
                    <input
                      type="date"
                      value={newBlockOut.fromDate}
                      onChange={(e) => setNewBlockOut({ ...newBlockOut, fromDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To Date</label>
                    <input
                      type="date"
                      value={newBlockOut.toDate}
                      onChange={(e) => setNewBlockOut({ ...newBlockOut, toDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Reason (Optional)</label>
                  <input
                    type="text"
                    value={newBlockOut.reason}
                    onChange={(e) => setNewBlockOut({ ...newBlockOut, reason: e.target.value })}
                    placeholder="e.g., Maintenance, Pre-booked"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <button
                  onClick={handleAddBlockOut}
                  disabled={!newBlockOut.fromDate || !newBlockOut.toDate}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Block Out Period
                </button>
              </div>
            )}

            {/* Existing Block Out Periods */}
            {settings.blockOutPeriods.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Active Block Outs</label>
                {settings.blockOutPeriods.map((period) => (
                  <div 
                    key={period.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {new Date(period.fromDate).toLocaleDateString()} - {new Date(period.toDate).toLocaleDateString()}
                      </p>
                      {period.reason && (
                        <p className="text-xs text-red-600">{period.reason}</p>
                      )}
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => handleRemoveBlockOut(period.id)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
