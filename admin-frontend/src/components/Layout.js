import { Leaf, LogOut, Menu, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';

const navItems = [
    { path: '/', label: 'Soumissions' },
    { path: '/reports/auto', label: 'Signalements Auto' },
    { path: '/reports/users', label: 'Signalements Utilisateurs' },
    { path: '/additives/pending', label: 'Additifs Inconnus' },
    { path: '/cosmetics/submissions', label: 'Cosmétiques' },
    { path: '/monitoring', label: 'Monitoring' },
];

const Layout = () => {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        authAPI.logout();
        navigate('/login');
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Horizontal Navbar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Left: Logo + burger mobile */}
                        <div className="flex items-center">
                            <button
                                className="md:hidden p-2 -ml-2 mr-1 text-gray-500 hover:text-gray-700"
                                onClick={() => setMobileOpen(!mobileOpen)}
                                aria-label="Menu"
                            >
                                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                            <div className="flex-shrink-0 flex items-center">
                                <Leaf className="h-8 w-8 text-emerald-600 mr-2" />
                                <span className="text-xl font-bold text-gray-900">DZnutri Admin</span>
                            </div>
                        </div>

                        {/* Center: Navigation Links (desktop) */}
                        <div className="hidden md:flex items-center space-x-8">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${isActive
                                            ? 'border-emerald-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <button
                                onClick={handleRefresh}
                                className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                                title="Rafraîchir"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                            >
                                <LogOut className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Déconnexion</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation mobile : le menu était simplement invisible (< md)
                    avant — l'admin était inutilisable sur téléphone. */}
                {mobileOpen && (
                    <nav className="md:hidden border-t border-gray-100 bg-white px-4 py-2 space-y-1 shadow-sm">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `block px-3 py-2 rounded-md text-sm font-medium ${isActive
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
