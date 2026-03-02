import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className="main">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;