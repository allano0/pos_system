import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import SignIn from './pages/SignIn'
import OwnerDashboard from './pages/OwnerDashboard'
import Layout from './components/Layout'
import Sale from './pages/Sale'
import Customers from './pages/Customers'
import Cashiers from './pages/Cashiers'
import Products from './pages/Products'
import Suppliers from './pages/Suppliers'
import CreditNote from './pages/CreditNote'
import DataSync from './pages/DataSync'
import Branches from './pages/Branches'
import Receipts from './pages/Receipts'

function getRole(): 'default' | 'cashier' {
  const val = sessionStorage.getItem('role');
  if (val === 'cashier') return 'cashier';
  return 'default';
}

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  const role = getRole();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/owner-dashboard" element={<Layout role={role}><OwnerDashboard /></Layout>} />
        <Route path="/sale" element={<Layout role={role}><Sale /></Layout>} />
        <Route path="/customers" element={<Layout role={role}><Customers /></Layout>} />
        <Route path="/cashiers" element={<Layout role={role}><Cashiers /></Layout>} />
        <Route path="/products" element={<Layout role={role}><Products /></Layout>} />
        <Route path="/suppliers" element={<Layout role={role}><Suppliers /></Layout>} />
        <Route path="/credit-note" element={<Layout role={role}><CreditNote /></Layout>} />
        <Route path="/data-sync" element={<Layout role={role}><DataSync /></Layout>} />
        <Route path="/branches" element={<Layout role={role}><Branches /></Layout>} />
        <Route path="/receipts" element={<Layout role={role}><Receipts /></Layout>} />
        <Route path="/dashboard" element={<Layout role={role}><OwnerDashboard /></Layout>} />
        <Route path="*" element={
          <Layout role={role}>
            <img alt="logo" className="logo" src={electronLogo} />
            <div className="creator">Powered by electron-vite</div>
            <div className="text">
              Build an Electron app with <span className="react">React</span>
              &nbsp;and <span className="ts">TypeScript</span>
            </div>
            <p className="tip">
              Please try pressing <code>F12</code> to open the devTool
            </p>
            <div className="actions">
              <div className="action">
                <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
                  Documentation
                </a>
              </div>
              <div className="action">
                <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
                  Send IPC
                </a>
              </div>
            </div>
            <Versions></Versions>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
