import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import AuthRouteSync from './components/AuthRouteSync';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './lib/auth';
import { I18nProvider, useI18n } from './lib/i18n';
import AboutPage from './pages/AboutPage';
import AddEvidencePage from './pages/AddEvidencePage';
import AdminEvidence from './pages/admin/AdminEvidence';
import AdminHome from './pages/admin/AdminHome';
import AdminLayout from './pages/admin/AdminLayout';
import AdminTakedowns from './pages/admin/AdminTakedowns';
import AdminTheoriesQueue from './pages/admin/AdminTheoriesQueue';
import AdminUsers from './pages/admin/AdminUsers';
import AuthPage from './pages/AuthPage';
import EditTheoryPage from './pages/EditTheoryPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import ProfileEditPage from './pages/ProfileEditPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import SupportPage from './pages/SupportPage';
import TakedownNewPage from './pages/TakedownNewPage';
import TakedownsPage from './pages/TakedownsPage';
import TheoryDetailPage from './pages/TheoryDetailPage';
import SubmitPage from './pages/submit/SubmitPage';

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
        <AuthRouteSync />
        <div className="min-h-screen bg-bg flex flex-col pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
          <Header />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/theory/:id" element={<TheoryDetailPage />} />
              <Route path="/theory/:id/edit" element={<EditTheoryPage />} />
              <Route path="/theory/:id/add-evidence" element={<AddEvidencePage />} />
              <Route path="/submit" element={<SubmitPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/takedowns" element={<TakedownsPage />} />
              <Route path="/takedowns/new" element={<TakedownNewPage />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route path="/u/:username" element={<ProfilePage />} />
              <Route path="/me" element={<ProfilePage self />} />
              <Route path="/me/edit" element={<ProfileEditPage />} />
              <Route
                path="/admin"
                element={
                  <RequireAuth adminOnly>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<AdminHome />} />
                <Route path="theories" element={<AdminTheoriesQueue />} />
                <Route path="evidence" element={<AdminEvidence />} />
                <Route path="takedowns" element={<AdminTakedowns />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          <Footer />
          <BottomNav />
        </div>
      </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}

const PROPOSE_CATEGORY_URL =
  import.meta.env.VITE_PROPOSE_CATEGORY_URL ??
  'mailto:hello@conspira.io?subject=Propose%20a%20category';

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted flex flex-wrap items-center justify-between gap-3">
        <span>{t.footer.copyright}</span>
        <nav className="flex flex-wrap items-center gap-4">
          <Link to="/about" className="hover:text-ink">{t.footer.about}</Link>
          <Link to="/takedowns" className="hover:text-ink">{t.footer.takedowns}</Link>
          <Link to="/support" className="hover:text-ink">{t.footer.support}</Link>
          <Link to="/submit" className="hover:text-ink">{t.footer.submit}</Link>
          <a
            href={PROPOSE_CATEGORY_URL}
            className="hover:text-ink"
            target={PROPOSE_CATEGORY_URL.startsWith('mailto:') ? undefined : '_blank'}
            rel={PROPOSE_CATEGORY_URL.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
          >
            {t.footer.proposeCategory}
          </a>
          <span className="font-mono-num">{t.footer.version}</span>
        </nav>
      </div>
    </footer>
  );
}
