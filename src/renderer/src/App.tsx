import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import SignIn from './pages/SignIn'
import CashierDashboard from './pages/CashierDashboard'
import OwnerDashboard from './pages/OwnerDashboard'
import Layout from './components/Layout'
import Sale from './pages/Sale'
import Customers from './pages/Customers'
import Cashiers from './pages/Cashiers'
import Products from './pages/Products'
import Suppliers from './pages/Suppliers'
import CreditNote from './pages/CreditNote'
import DataSync from './pages/DataSync'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/cashier-dashboard" element={<Layout><CashierDashboard /></Layout>} />
        <Route path="/owner-dashboard" element={<Layout><OwnerDashboard /></Layout>} />
        <Route path="/sale" element={<Layout><Sale /></Layout>} />
        <Route path="/customers" element={<Layout><Customers /></Layout>} />
        <Route path="/cashiers" element={<Layout><Cashiers /></Layout>} />
        <Route path="/products" element={<Layout><Products /></Layout>} />
        <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />
        <Route path="/credit-note" element={<Layout><CreditNote /></Layout>} />
        <Route path="/data-sync" element={<Layout><DataSync /></Layout>} />
        <Route path="*" element={
          <Layout>
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
