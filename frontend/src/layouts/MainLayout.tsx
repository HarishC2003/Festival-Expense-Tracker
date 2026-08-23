import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFestivalYear } from '../context/FestivalYearContext';
import { useGroup } from '../context/GroupContext';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { LogOut, Settings, CalendarDays, Users, LayoutDashboard, Store, Tags, Banknote, Package, Receipt, CheckSquare, Image as ImageIcon, FileText, PieChart, Menu, X, List } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { LanguageSwitcher } from '../components/shared/LanguageSwitcher';
import logo from '../assets/logo.png';

export const MainLayout: React.FC = () => {
  const { user, role, isPlatformAdmin, signOut } = useAuth();
  const { activeGroupRole } = useGroup();
  const { activeYear } = useFestivalYear();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const NavLink = ({ to, children, icon: Icon }: { to: string; children: React.ReactNode; icon: any }) => (
    <Link 
      to={to} 
      onClick={() => setIsMobileMenuOpen(false)}
      className={cn(
        "flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg transition-colors",
        location.pathname === to ? "bg-[#1C2039] text-white font-medium" : "text-muted-foreground hover:text-white hover:bg-white/5"
      )}
    >
      <Icon size={18} />
      <span>{children}</span>
    </Link>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0B10] relative">
      {/* Ambient Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-purple-500/20 blur-[100px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[40%] left-[60%] w-[25%] h-[25%] rounded-full bg-cyan-500/10 blur-[80px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '4s' }} />

      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 border-r border-border/50 bg-[#0A0D1D] flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 md:p-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-sans font-bold text-white tracking-tight">
              Festival Expense Tracker
            </h1>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto pb-6">
          {isPlatformAdmin && (
            <NavLink to="/admin" icon={Settings}>{t('sidebar.admin')}</NavLink>
          )}
          <NavLink to="/dashboard" icon={LayoutDashboard}>{t('sidebar.dashboard')}</NavLink>
          
          <div className="pt-6 pb-2 px-4 text-xs font-semibold text-brass/70 uppercase tracking-wider border-b border-brass/10 mb-2">{t('sidebar.income')}</div>
          <NavLink to="/income/cash" icon={Banknote}>{t('sidebar.cashDonations')}</NavLink>
          <NavLink to="/income/items" icon={Package}>{t('sidebar.itemDonations')}</NavLink>

          <div className="pt-6 pb-2 px-4 text-xs font-semibold text-brass/70 uppercase tracking-wider border-b border-brass/10 mb-2">{t('sidebar.expenses')}</div>
          <NavLink to="/expenses" icon={Receipt}>{t('sidebar.allExpenses')}</NavLink>
          {activeGroupRole === 'owner' && (
            <NavLink to="/expenses/approvals" icon={CheckSquare}>{t('sidebar.approvalQueue')}</NavLink>
          )}

          <div className="pt-6 pb-2 px-4 text-xs font-semibold text-brass/70 uppercase tracking-wider border-b border-brass/10 mb-2">{t('sidebar.reportsMedia')}</div>
          <NavLink to="/transactions" icon={List}>{t('sidebar.allTransactions')}</NavLink>
          <NavLink to="/reports" icon={PieChart}>{t('sidebar.reports')}</NavLink>
          <NavLink to="/gallery" icon={ImageIcon}>{t('sidebar.gallery')}</NavLink>
          <NavLink to="/documents" icon={FileText}>{t('sidebar.documents')}</NavLink>

          <div className="pt-6 pb-2 px-4 text-xs font-semibold text-brass/70 uppercase tracking-wider border-b border-brass/10 mb-2">{t('sidebar.management')}</div>
          <NavLink to="/members" icon={Users}>{t('sidebar.groupMembers')}</NavLink>
          <div className="pt-6 pb-2 px-4 text-xs font-semibold text-brass/70 uppercase tracking-wider border-b border-brass/10 mb-2">{t('sidebar.system')}</div>
          <NavLink to="/settings" icon={Settings}>{t('sidebar.settings')}</NavLink>
          {role === 'super_admin' && (
            <NavLink to="/users" icon={Users}>{t('sidebar.users')}</NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="px-2">
            <div className="text-sm font-medium text-white truncate">{user?.email}</div>
            <div className="text-xs text-muted-foreground capitalize mt-1">{role?.replace('_', ' ')}</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col relative z-10">
        {/* Top Global Header */}
        <header className="sticky top-0 z-30 bg-background/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 md:px-8 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)} className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/groups" className="text-sm font-semibold text-brass hover:underline flex items-center gap-2">
              <span className="hidden md:inline">&larr; My Groups</span>
              <img src={logo} alt="Festival Expense Tracker" className="h-10 md:hidden" />
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-white" title={t('sidebar.signOut')}>
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{t('sidebar.signOut')}</span>
            </Button>
          </div>
        </header>
        
        <div className="p-4 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
