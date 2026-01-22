import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow px-6 py-4 flex justify-between">
      <h1 className="font-bold">Smart Habit Tracker</h1>
      <div className="space-x-4">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/habits">Habits</Link>
      </div>
    </nav>
  );
}
