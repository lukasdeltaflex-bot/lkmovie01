"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayout } from "@/context/layout-context";
import { signOutUser } from "@/lib/firebase/auth";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const { branding } = useBranding();
  const { user } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Buscar Cenas", href: "/buscar-cenas", icon: "🔍" },
    { label: "Biblioteca", href: "/biblioteca", icon: "📚" },
    { label: "Configurações", href: "/configuracoes", icon: "⚙️" },
  ];

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  return (
    <aside 
      className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col z-50 ${
        sidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-10 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-blue-500 transition-all shadow-lg active:scale-90"
      >
        <span className={`text-[10px] transform transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`}>
          ◀
        </span>
      </button>

      {/* Header */}
      <div className={`p-6 transition-all duration-300 ${sidebarCollapsed ? "opacity-0 invisible h-0 overflow-hidden" : "opacity-100 visible h-auto"}`}>
        <h2 className="text-xl font-bold text-blue-600 whitespace-nowrap flex items-center gap-2">
          <span className="text-2xl">{branding.logo}</span>
          {branding.appName}
        </h2>
      </div>
      
      <div className={`p-6 transition-all duration-300 flex justify-center ${sidebarCollapsed ? "opacity-100 visible" : "opacity-0 invisible h-0 overflow-hidden"}`}>
         <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-600/20">
           {branding.logo}
         </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 overflow-hidden whitespace-nowrap ${
                isActive 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold" 
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              <span className={`transition-opacity duration-300 ${sidebarCollapsed ? "opacity-0" : "opacity-100"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
        <Link 
           href="/perfil" 
           className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all overflow-hidden ${
             sidebarCollapsed ? "justify-center" : ""
           }`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 border-2 border-white dark:border-gray-800 shadow-sm">
            {user?.email?.[0].toUpperCase() || "U"}
          </div>
          <div className={`transition-opacity duration-300 overflow-hidden ${sidebarCollapsed ? "opacity-0 w-0" : "opacity-100"}`}>
            <p className="text-xs font-bold text-gray-700 dark:text-white truncate max-w-[120px]">
              {user?.email?.split('@')[0] || "Usuário"}
            </p>
            <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{user?.email}</p>
          </div>
        </Link>
        
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all overflow-hidden font-bold text-sm ${
            sidebarCollapsed ? "justify-center" : ""
          }`}
        >
           <span className="text-lg shrink-0">🚪</span>
           <span className={`transition-opacity duration-300 ${sidebarCollapsed ? "opacity-0 w-0" : "opacity-100"}`}>Sair</span>
        </button>
      </div>
    </aside>
  );
}
