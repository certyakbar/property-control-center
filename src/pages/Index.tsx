import { Navigate } from "react-router-dom";

// Redirect legacy index route to the dashboard.
export default function Index() {
  return <Navigate to="/" replace />;
}
