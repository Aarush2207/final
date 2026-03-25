import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, MessageSquare, TrendingUp, ArrowRight, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ManagerNavbar from '../../components/ManagerNavbar';
import { StatCard, Spinner } from '../../components/UI';
import { managerAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerAPI.getStats(user.id)
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <ManagerNavbar />
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    </div>
  );

  const roleChartData = (stats?.roles || []).map(r => ({
    name: r.name.length > 12 ? r.name.slice(0, 12) + '…' : r.name,
    employees: r.employeeCount,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <ManagerNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your team today.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Employees" value={stats?.totalEmployees ?? 0} icon={Users} color="blue" />
          <StatCard label="Roles Defined"   value={stats?.totalRoles ?? 0}      icon={Briefcase} color="purple" />
          <StatCard label="Interviews Done" value={stats?.completedInterviews ?? 0} icon={MessageSquare} color="green" />
          <StatCard label="Avg Rating"      value={`${stats?.averageRating ?? 0}/10`} icon={Star} color="orange" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Employees per role bar chart */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Employees per Role</h2>
            {roleChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={roleChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="employees" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                No roles created yet
              </div>
            )}
          </div>

          {/* Role distribution pie */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Role Distribution</h2>
            {roleChartData.some(r => r.employees > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={roleChartData.filter(r => r.employees > 0)}
                    dataKey="employees" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {roleChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Assign employees to roles to see distribution
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { to: '/manager/employees',  label: 'Manage Employees', icon: Users,   color: 'blue' },
              { to: '/manager/roles',      label: 'Manage Roles',     icon: Briefcase, color: 'purple' },
              { to: '/manager/interview',  label: 'Run AI Interview', icon: MessageSquare, color: 'green' },
              { to: '/manager/interviews', label: 'View History',     icon: TrendingUp, color: 'orange' },
            ].map(({ to, label, icon: Icon, color }) => (
              <Link key={to} to={to}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={`text-${color}-500`} />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
