import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Bell, Plus, Loader2, Calendar, Clock, X, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Pet, Reminder } from '../types';

export default function Reminders() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [formData, setFormData] = useState({
    type: 'feeding' as Reminder['type'],
    title: '',
    description: '',
    scheduled_time: '',
    repeat_days: [] as number[],
    active: true,
  });
  const [highlightedReminder, setHighlightedReminder] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    fetchPets();
    fetchReminders();
    
    // 檢查 URL 參數是否有指定提醒 ID
    const params = new URLSearchParams(location.search);
    const reminderId = params.get('id');
    if (reminderId) {
      setHighlightedReminder(reminderId);
      // 5 秒後取消高亮
      setTimeout(() => {
        setHighlightedReminder(null);
      }, 5000);
    }
  }, [location]);

  const fetchPets = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .order('name');

      if (error) throw error;
      setPets(data || []);
      if (data && data.length > 0) {
        setSelectedPet(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*, pets(name)')
        .order('scheduled_time');

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('reminders').insert([
        {
          pet_id: selectedPet,
          ...formData,
        },
      ]);

      if (error) throw error;

      setFormData({
        type: 'feeding',
        title: '',
        description: '',
        scheduled_time: '',
        repeat_days: [],
        active: true,
      });
      setShowForm(false);
      fetchReminders();
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  };

  const toggleReminderStatus = async (reminder: Reminder) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ active: !reminder.active })
        .eq('id', reminder.id);

      if (error) throw error;
      fetchReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm('確定要刪除這個提醒嗎？')) return;
    
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const handleDayToggle = (day: number) => {
    const newDays = formData.repeat_days.includes(day)
      ? formData.repeat_days.filter(d => d !== day)
      : [...formData.repeat_days, day].sort();
    setFormData({ ...formData, repeat_days: newDays });
  };

  const getTypeText = (type: Reminder['type']) => {
    switch (type) {
      case 'feeding':
        return '餵食';
      case 'medicine':
        return '餵藥';
      case 'cleaning':
        return '清理';
      case 'vaccine':
        return '疫苗';
      default:
        return '提醒';
    }
  };

  const getRepeatDaysText = (days: number[]) => {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    if (days.length === 7) return '每天';
    if (days.length === 0) return '無重複';
    return days.map(d => `週${weekdays[d]}`).join('、');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <nav className="bg-white shadow mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-500 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>返回主頁</span>
              </Link>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                新增提醒
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">提醒管理</h1>
          <p className="mt-1 text-gray-500">管理所有寵物的提醒事項</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="divide-y divide-gray-200">
            {reminders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>目前沒有任何提醒</p>
              </div>
            ) : (
              reminders.map((reminder) => (
                <div 
                  key={reminder.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    highlightedReminder === reminder.id ? 'bg-blue-50 animate-pulse' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        reminder.type === 'feeding' ? 'bg-green-100 text-green-600' :
                        reminder.type === 'medicine' ? 'bg-red-100 text-red-600' :
                        reminder.type === 'cleaning' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {reminder.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                          <span>{getTypeText(reminder.type)}</span>
                          <span>·</span>
                          <span>{reminder.scheduled_time.slice(0, 5)}</span>
                          <span>·</span>
                          <span>{getRepeatDaysText(reminder.repeat_days)}</span>
                        </div>
                        {reminder.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {reminder.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleReminderStatus(reminder)}
                        className={`p-1 rounded-full ${
                          reminder.active
                            ? 'text-green-600 hover:bg-green-100'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={reminder.active ? '停用提醒' : '啟用提醒'}
                      >
                        {reminder.active ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded-full"
                        title="刪除提醒"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">新增提醒</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">寵物</label>
                <select
                  value={selectedPet}
                  onChange={(e) => setSelectedPet(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">提醒類型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Reminder['type'] })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="feeding">餵食提醒</option>
                  <option value="medicine">餵藥提醒</option>
                  <option value="cleaning">清理提醒</option>
                  <option value="vaccine">疫苗提醒</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">標題</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">描述 (選填)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">時間</label>
                <input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">重複</label>
                <div className="flex gap-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(index)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        formData.repeat_days.includes(index)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  儲存
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}