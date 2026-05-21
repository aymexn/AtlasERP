'use client';

import { usePathname } from '@/navigation';
import { Menu, LogOut } from 'lucide-react';
import UserProfile from './UserProfile';
import NotificationsDropdown from './NotificationsDropdown';

const Topbar = () => {
    const pathname = usePathname();
    
    // Map paths to French titles
    const getPageTitle = (path: string) => {
        const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
        
        if (cleanPath === '/dashboard' || cleanPath === '') return 'Tableau de Bord';
        if (cleanPath === '/sales/customers') return 'Gestion des Clients';
        if (cleanPath === '/sales/orders') return 'Bons de Commande Client';
        if (cleanPath === '/purchases/suppliers') return 'Gestion des Fournisseurs';
        if (cleanPath === '/purchases/orders') return 'Bons de Commande Fournisseur';
        if (cleanPath === '/purchases/receptions') return 'Réceptions de Stock';
        if (cleanPath === '/products') return 'Catalogue des Articles';
        if (cleanPath === '/product-families') return 'Familles d\'Articles';
        if (cleanPath === '/inventory') return 'Gestion des Stocks';
        if (cleanPath === '/manufacturing/orders') return 'Ordres de Fabrication';
        if (cleanPath === '/invoices') return 'Factures';
        if (cleanPath === '/treasury/aged-receivables') return 'Balance Âgée Clients';
        if (cleanPath === '/treasury/forecast') return 'Prévisions de Trésorerie';
        if (cleanPath === '/expenses') return 'Gestion des Dépenses';
        if (cleanPath === '/analytics') return 'Statistiques & Rapports';
        if (cleanPath === '/analytics/abc') return 'Analyse ABC';
        if (cleanPath === '/analytics/dead-stock') return 'Morts en Stock';
        if (cleanPath === '/hr/employees') return 'Gestion des Employés';
        if (cleanPath === '/hr/leaves') return 'Demandes de Congés';
        if (cleanPath === '/hr/payroll') return 'Gestion de la Paie';
        if (cleanPath === '/hr/recruitment') return 'Recrutement & Offres';
        if (cleanPath === '/hr/performance') return 'Suivi des Performances';
        if (cleanPath.startsWith('/settings')) return 'Paramètres du Système';
        if (cleanPath.startsWith('/collaboration')) return 'Espace Collaboratif';
        
        return 'Atlas Intelligence';
    };
    
    const pageTitle = getPageTitle(pathname);

    return (
        <header className="bg-white border-b border-slate-100 h-16 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-all shadow-sm">
            {/* Left Section: Logo & Mobile Menu */}
            <div className="flex items-center gap-3">
                <button className="md:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-500">
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 shrink-0 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-[18px] text-white shadow-sm">
                        A
                    </div>
                    <span className="text-[18px] font-black tracking-tight text-slate-800 hidden sm:inline-block">
                        Atlas<span className="text-blue-600">ERP</span>
                    </span>
                </div>
            </div>

            {/* Center Section: Page Title */}
            <div className="flex-1 flex justify-center px-4">
                <h1 className="text-base font-extrabold text-slate-800 tracking-tight text-center truncate max-w-[200px] sm:max-w-md md:max-w-lg">
                    {pageTitle}
                </h1>
            </div>

            {/* Right Section: Notifications, User Profile & Direct Logout */}
            <div className="flex items-center gap-2">
                <NotificationsDropdown />
                
                <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />
                
                <UserProfile />
                
                <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

                <button 
                    onClick={() => {
                        localStorage.removeItem('atlas_token');
                        window.location.href = '/login';
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Se déconnecter"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

export default Topbar;
