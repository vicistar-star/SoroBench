import React from "react";
import { createRoot } from "react-dom/client";

const App: React.FC = () => {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>SoroBench Dashboard</h1>
      <p>Performance Benchmarking for Soroban Smart Contracts</p>
      <p><em>Dashboard UI — coming soon</em></p>
    </main>
  );
};

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}

export default App;
