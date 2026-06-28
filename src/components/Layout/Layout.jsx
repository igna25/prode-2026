import { Outlet } from "react-router-dom";
import Header from "./Header";
import Navbar from "./Navbar";
import InstallBanner from "../UI/InstallBanner";
import UpdateBanner from "../UI/UpdateBanner";
import NotificationBanner from "../UI/NotificationBanner";

export default function Layout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <Navbar />
      <InstallBanner />
      <UpdateBanner />
      <NotificationBanner />
    </div>
  );
}
