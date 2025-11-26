import {
    Activity,
    AlertTriangle,
    FlaskConical,
    Inbox,
    LogOut,
    Menu,
    UserX,
    X
} from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const navItems = [
        { path: '/', label: 'Soumissions', icon: Inbox },
        { path: '/reports/auto', label: 'Signalements Auto', icon: AlertTriangle },
        { path: '/reports/users', label: 'Signalements Utilisateurs', icon: UserX },
        { path: '/additives/pending', label: 'Additifs Inconnus', icon: FlaskConical },
        { path: '/monitoring', label: 'Monitoring', icon: Activity, disabled: true, badge: 'Bientôt' },
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
                onClick={toggleSidebar}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar Container */}
            <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-auto md:flex md:flex-col
      `}>
                {/* Logo / Header */}
                <div className="flex items-center justify-center h-16 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-2">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                {item.disabled ? (
                                    <div className="flex items-center px-4 py-3 text-gray-400 cursor-not-allowed">
                                        <item.icon className="w-5 h-5 mr-3" />
                                        <span className="flex-1">{item.label}</span>
                                        {item.badge && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) => `
                      flex items-center px-4 py-3 rounded-md transition-colors duration-200
                      ${isActive
                                                ? 'bg-emerald-50 text-emerald-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                                        onClick={() => setIsOpen(false)} // Close sidebar on mobile when link clicked
                                    >
                                        <item.icon className="w-5 h-5 mr-3" />
                                        {item.label}
                                    </NavLink>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer / Logout */}
                <div className="border-t border-gray-200 p-4">
                    <button className="flex items-center w-full px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200">
                        <LogOut className="w-5 h-5 mr-3" />
                        Déconnexion
                    </button>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;
