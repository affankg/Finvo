import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

// Sidebar Icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
  </svg>
);

const ClientsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const QuotationsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const InvoicesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
  </svg>
);

const FinancialIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Navigation configuration
const navigation = [
  { name: 'Dashboard', href: '/', icon: DashboardIcon },
  { name: 'Clients', href: '/clients', icon: ClientsIcon },
  { name: 'Quotations', href: '/quotations', icon: QuotationsIcon },
  { name: 'Invoices', href: '/invoices', icon: InvoicesIcon },
  { name: 'Financial Activities', href: '/financial', icon: FinancialIcon },
];

// Sidebar Component
interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  
  const isCurrentPath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link 
              to="/" 
              className="flex items-center space-x-3 group"
              onClick={() => setIsOpen(false)}
            >
              <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">BS</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-blue-700 bg-clip-text text-transparent">
                BS Engineering
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = isCurrentPath(item.href);
              const IconComponent = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-100 to-blue-50 text-indigo-700 border-r-4 border-indigo-500 shadow-sm'
                      : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <IconComponent />
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg bg-gradient-to-r from-slate-50 to-indigo-50 mb-2 shadow-sm">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">Admin User</p>
                <p className="text-xs text-indigo-600">Administrator</p>
              </div>
            </div>
            <button className="w-full flex items-center px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-gradient-to-r hover:from-rose-50 hover:to-red-50 hover:text-rose-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Layout Component
interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
              >
                <MenuIcon />
              </button>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-blue-700 bg-clip-text text-transparent">
                BS Engineering
              </h1>
              <div className="w-10" />
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto focus:outline-none">
            <div className="relative">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Page Components
const Dashboard = () => (
  <Layout>
    <div className="p-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 border-l-4 border-indigo-500">
          <h3 className="text-lg font-semibold text-slate-700">Total Clients</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">24</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 border-l-4 border-emerald-500">
          <h3 className="text-lg font-semibold text-slate-700">Active Quotations</h3>
          <p className="text-3xl font-bold text-emerald-600 mt-2">8</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 border-l-4 border-amber-500">
          <h3 className="text-lg font-semibold text-slate-700">Pending Invoices</h3>
          <p className="text-3xl font-bold text-amber-600 mt-2">12</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-slate-700">Monthly Revenue</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">Rs. 45,250</p>
        </div>
      </div>
    </div>
  </Layout>
);

const Clients = () => (
  <Layout>
    <div className="p-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">Clients</h1>
      <div className="bg-white shadow-lg rounded-lg border-l-4 border-indigo-500">
        <div className="p-6">
          <p className="text-slate-600 font-medium">Client management interface will be here.</p>
        </div>
      </div>
    </div>
  </Layout>
);

const Quotations = () => (
  <Layout>
    <div className="p-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">Quotations</h1>
      <div className="bg-white shadow-lg rounded-lg border-l-4 border-emerald-500">
        <div className="p-6">
          <p className="text-slate-600 font-medium">Quotation management interface will be here.</p>
        </div>
      </div>
    </div>
  </Layout>
);

const Invoices = () => (
  <Layout>
    <div className="p-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">Invoices</h1>
      <div className="bg-white shadow-lg rounded-lg border-l-4 border-blue-500">
        <div className="p-6">
          <p className="text-slate-600 font-medium">Invoice management interface will be here.</p>
        </div>
      </div>
    </div>
  </Layout>
);

const Financial = () => (
  <Layout>
    <div className="p-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">Financial Activities</h1>
      <div className="bg-white shadow-lg rounded-lg border-l-4 border-amber-500">
        <div className="p-6">
          <p className="text-slate-600 font-medium">Financial activities interface will be here.</p>
        </div>
      </div>
    </div>
  </Layout>
);

// Main App Component
const WorkingApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/financial" element={<Financial />} />
      </Routes>
    </Router>
  );
};

export default WorkingApp;
