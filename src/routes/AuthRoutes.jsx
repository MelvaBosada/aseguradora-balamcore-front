import { Route } from "react-router-dom"
import Auth from "../pages/Auth"
import LandingPage from "../pages/LandingPage"

export const AuthRoutes = [
  <Route key="landing" path="/" element={<LandingPage />} />,
  <Route key="auth" path="/login" element={<Auth />} />
]
