import { BrowserRouter, Route, Routes } from "react-router-dom";
import ChatMessagePage from "./pages/ChatMessagePage";
import ErrorPage from "./pages/ErrorPage";
import TableDataPage from "./pages/TableDataPage";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import MasterLayout from "./masterLayout/MasterLayout";
import DashBoardLayerEight from "./components/DashBoardLayerEight";
import { AppProvider } from "./context/AppContext";
import './assets/css/style.css';
import './assets/css/extra.css';
import './assets/css/remixicon.css';
import NotificationBar from "./masterLayout/NotificationBar";
import Queries from "./components/Queries";
import Login from "./components/Login";
import ProtectedRoute from "./masterLayout/ProtectedRoute";
import ChatRequestNotification from "./components/ChatRequestNotification";


function App() {
  return (
    <AppProvider>
      <NotificationBar />
      <ChatRequestNotification/>
      <BrowserRouter>
        <RouteScrollToTop />
        <Routes>
          <Route path="*" element={<ErrorPage />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MasterLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashBoardLayerEight />} />
            <Route path="appointments" element={<TableDataPage />} />
            <Route path="chat" element={<ChatMessagePage />} />
            <Route path="queries" element={<Queries />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
