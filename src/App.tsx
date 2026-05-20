import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import Agents from "./pages/Agents";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Keys from "./pages/Keys";
import Trace from "./pages/Trace";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/keys" element={<Keys />} />
        <Route path="/trace" element={<Trace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
