import { BrowserRouter, Route, Routes } from "react-router-dom";
import ChatMessagePage from "./pages/ChatMessagePage";
import ChatProfilePage from "./pages/ChatProfilePage";
import ErrorPage from "./pages/ErrorPage";
import TableDataPage from "./pages/TableDataPage";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import HomePageEight from "./pages/HomePageEight";
import '../public/assets/css/style.css'
import MasterLayout from "./masterLayout/MasterLayout";
import DashBoardLayerEight from "./components/DashBoardLayerEight";
import { AppProvider } from "./context/AppContext";
function App() {
  return (
    // <BrowserRouter>
    //   <RouteScrollToTop />
    //   <Routes>
    //     <Route exact path='/' element={<MasterLayout />} />
    //     {/* SL */}
    //     <Route exact path='/chat-message' element={<ChatMessagePage />} />
    //     <Route exact path='/chat-profile' element={<ChatProfilePage />} />
    //     <Route exact path='/admin-appointments' element={<TableDataPage />} />

    //     <Route exact path='*' element={<ErrorPage />} />
    //   </Routes>
    // </BrowserRouter>

<AppProvider>
<BrowserRouter>
<RouteScrollToTop />

      <Routes>
        <Route path="/" element={<MasterLayout />}>
          <Route index element={<DashBoardLayerEight/>} />
          <Route path="appointments" element={<TableDataPage />} />
          <Route path="chat" element={<ChatMessagePage />} />
        </Route>
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
    </AppProvider>
  );
}

export default App;
