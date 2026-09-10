import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ROLES } from './constants/roles'
import { AuthProvider } from './contexts/AuthProvider'
import ProtectedRoute from './routes/ProtectedRoute'
import Dashboard from './pages/admin/Dashboard'
import DataMaster from './pages/admin/DataMaster'
import HasilSeleksi from './pages/admin/HasilSeleksi'
import Settings from './pages/admin/Settings'
import Beasiswa from './pages/applicant/Beasiswa'
import WizardPendaftaran from './pages/applicant/WizardPendaftaran'
import MonitoringStatus from './pages/applicant/MonitoringStatus'
import BeasiswaDetailPage from './pages/public/BeasiswaDetailPage'
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import NotFound from './pages/NotFound'
import Unauthorized from './pages/Unauthorized'
import VerifikasiDetail from './pages/verifikator/VerifikasiDetail'
import VerifikasiList from './pages/verifikator/VerifikasiList'
import WawancaraForm from './pages/seleksi/WawancaraForm'
import WawancaraList from './pages/seleksi/WawancaraList'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/beasiswa', element: <LandingPage /> },
  { path: '/beasiswa/:id', element: <BeasiswaDetailPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.CALON_PESERTA]} />,
    children: [
      { path: '/applicant/beasiswa', element: <Beasiswa /> },
      { path: '/applicant/pendaftaran', element: <WizardPendaftaran /> },
      { path: '/applicant/status', element: <MonitoringStatus /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.VERIFIKATOR]} />,
    children: [
      { path: '/verifikator/list', element: <VerifikasiList /> },
      { path: '/verifikator/verifikasi', element: <VerifikasiList /> },
      { path: '/verifikator/verifikasi/:id', element: <VerifikasiDetail /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.SELEKSI]} />,
    children: [
      { path: '/lembaga-seleksi/list', element: <WawancaraList /> },
      { path: '/seleksi/wawancara', element: <WawancaraList /> },
      { path: '/seleksi/wawancara/:id', element: <WawancaraForm /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />,
    children: [
      { path: '/admin/dashboard', element: <Dashboard /> },
      { path: '/admin/data-master', element: <DataMaster /> },
      { path: '/admin/hasil-seleksi', element: <HasilSeleksi /> },
      { path: '/admin/settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App