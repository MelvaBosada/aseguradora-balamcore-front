import { BrowserRouter, Routes } from "react-router-dom"
import { AuthRoutes } from "./AuthRoutes"
import { AdminRoutes } from "./AdminRoutes"

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {AuthRoutes}
        {AdminRoutes}
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes