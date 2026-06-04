import { BrowserRouter, Routes } from "react-router-dom"
import { AuthRoutes } from "./AuthRoutes"
import { AdminRoutes } from "./AdminRoutes"
import { SuperAdminRoutes} from "./SuperAdminRoutes"


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {AuthRoutes}
        {AdminRoutes}
        {SuperAdminRoutes}
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes