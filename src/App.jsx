import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TimerPage from "./pages/TimerPage";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Main Countdown Timer Page Route */}
        <Route path="/" element={<TimerPage />} />
      </Routes>
    </Router>
  );
}
