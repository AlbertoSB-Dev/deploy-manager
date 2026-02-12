'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Users, CreditCard, Settings, Rocket, Shield, Menu, X, Activity, ArrowLeft, LogOut, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  // Verificação de autenticação centralizada no layout
  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Mostrar loading enquanto verifica auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Não renderizar nada se não tiver permissão
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/admin' },
    { icon: Users, label: 'Usuários', href: '/admin/users' },
    { icon: CreditCard, label: 'Planos', href: '/admin/plans' },
    { icon: CreditCard, label: 'Assinaturas', href: '/admin/subscriptions' },
    { icon: DollarSign, label: 'Receita', href: '/admin/revenue' },
    { icon: Settings, label: 'Configurações', href: '/admin/settings' },
    { icon: Activity, label: 'Monitoramento', href: '/admin/monitoring' },
    { icon: Rocket, label: 'Deploy Painel', href: '/admin/panel-deploy' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Mobile Menu Button (Floating) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl blur-lg opacity-50"></div>
                <div className="relative p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              {sidebarOpen && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Admin Panel
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  {sidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
            {/* User Info */}
            {sidebarOpen && (
              <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="text-white flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{user?.name}</div>
                  <div className="text-xs opacity-90">{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Back to Dashboard */}
              <button
                onClick={handleBackToDashboard}
                className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 ${
                  !sidebarOpen && 'justify-center'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                {sidebarOpen && <span className="text-sm font-medium">Voltar ao Dashboard</span>}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-red-700 dark:text-red-400 ${
                  !sidebarOpen && 'justify-center'
                }`}
              >
                <LogOut className="w-5 h-5" />
                {sidebarOpen && <span className="text-sm font-medium">Sair</span>}
              </button>
            </div>
            
            {/* Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
