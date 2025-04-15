import { BrowserRouter, Route, Routes } from "react-router-dom";
import ChatMessagePage from "./pages/ChatMessagePage";
import ChatProfilePage from "./pages/ChatProfilePage";
import ErrorPage from "./pages/ErrorPage";
import TableDataPage from "./pages/TableDataPage";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import HomePageEight from "./pages/HomePageEight";

function App() {
  return (
    <BrowserRouter>
      <RouteScrollToTop />
      <Routes>
        <Route exact path='/' element={<HomePageEight />} />
        {/* SL */}
        <Route exact path='/chat-message' element={<ChatMessagePage />} />
        <Route exact path='/chat-profile' element={<ChatProfilePage />} />
        <Route exact path='/admin-appointments' element={<TableDataPage />} />

        <Route exact path='*' element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
