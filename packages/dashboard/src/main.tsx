import React from "react";
import { createRoot } from "react-dom/client";

const App: React.FC = () => {
  return (
    <main className="min-h-screen bg-gray-900 text-white font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">⚡ SoroBench Dashboard</h1>
            <p className="text-gray-400">Performance Metrics & Historical Trends for Soroban</p>
          </div>
          <div className="flex gap-4">
            <span className="bg-gray-800 px-3 py-1 rounded text-sm text-gray-300">v0.1.0</span>
            <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded text-sm border border-green-800">Connected</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Contracts</h3>
            <p className="text-4xl font-bold">12</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Benchmarks</h3>
            <p className="text-4xl font-bold">142</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Success Rate</h3>
            <p className="text-4xl font-bold text-green-400">98.2%</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
          <div className="inline-block p-4 rounded-full bg-cyan-900/20 text-cyan-400 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Dashboard UI — Coming Soon</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            The full interactive dashboard with trend charts, flame graph viewer, and regression history is currently under development.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded font-medium transition-colors">
              View Documentation
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium transition-colors">
              GitHub Repository
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}

export default App;
