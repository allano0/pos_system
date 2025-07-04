import React, { useMemo, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const SALES_KEY = 'pos_sales';
const PRODUCTS_KEY = 'pos_products';
const BRANCHES_KEY = 'pos_branches';
const CASHIERS_KEY = 'pos_cashiers';

function getLocal<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function getMonthYear(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function OwnerDashboard() {
  // Filters
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Data
  const sales = useMemo(() => getLocal<any>(SALES_KEY), []);
  const products = useMemo(() => getLocal<any>(PRODUCTS_KEY), []);
  const branches = useMemo(() => getLocal<any>(BRANCHES_KEY), []);
  const cashiers = useMemo(() => getLocal<any>(CASHIERS_KEY), []);

  // Branch options
  const branchOptions = branches.map((b: any) => ({ value: b.id, label: b.name }));
  // Month options from sales
  const monthOptions = Array.from(new Set(sales.map(s => getMonthYear(s.date))));

  // Filtered sales
  const filteredSales = sales.filter(sale => {
    let branchMatch = true;
    let monthMatch = true;
    if (selectedBranch) {
      // Try to infer branch from cashier (if cashier has branchId)
      const cashier = cashiers.find((c: any) => c.name === sale.userName);
      branchMatch = cashier ? cashier.branchId === selectedBranch : false;
    }
    if (selectedMonth) {
      monthMatch = getMonthYear(sale.date) === selectedMonth;
    }
    return branchMatch && monthMatch;
  });

  // Estimated sales by day in selected month
  const salesByDay = useMemo(() => {
    const days: { [date: string]: number } = {};
    filteredSales.forEach(sale => {
      const d = new Date(sale.date);
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days[day] = (days[day] || 0) + sale.total;
    });
    return days;
  }, [filteredSales]);

  // Low stock items (stock <= 5)
  const lowStock = products.filter((p: any) => p.stock <= 5);

  // Best performing items (by quantity sold)
  const itemSales: { [id: string]: { name: string; qty: number } } = {};
  sales.forEach(sale => {
    sale.items.forEach((item: any) => {
      if (!itemSales[item.id]) itemSales[item.id] = { name: item.name, qty: 0 };
      itemSales[item.id].qty += item.quantity;
    });
  });
  const bestItems = Object.values(itemSales).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Cashiers with most sales (by total sales amount)
  const cashierSales: { [name: string]: number } = {};
  sales.forEach(sale => {
    cashierSales[sale.userName] = (cashierSales[sale.userName] || 0) + sale.total;
  });
  const topCashiers = Object.entries(cashierSales)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Chart data
  const salesLineData = {
    labels: Object.keys(salesByDay),
    datasets: [
      {
        label: 'Estimated Sales',
        data: Object.values(salesByDay),
        borderColor: '#3182ce',
        backgroundColor: 'rgba(49,130,206,0.2)',
        fill: true,
      },
    ],
  };

  const bestItemsData = {
    labels: bestItems.map(i => i.name),
    datasets: [
      {
        label: 'Quantity Sold',
        data: bestItems.map(i => i.qty),
        backgroundColor: [
          '#3182ce', '#63b3ed', '#90cdf4', '#4299e1', '#2b6cb0',
        ],
      },
    ],
  };

  const topCashiersData = {
    labels: topCashiers.map(c => c.name),
    datasets: [
      {
        label: 'Total Sales',
        data: topCashiers.map(c => c.total),
        backgroundColor: [
          '#38a169', '#68d391', '#276749', '#22543d', '#9ae6b4',
        ],
      },
    ],
  };

  return (
    <div style={{ padding: 32, maxWidth: 1400, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 32, fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: '#223' }}>Owner Dashboard Analytics</h2>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontWeight: 600, marginRight: 8 }}>Branch:</label>
          <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 16 }}>
            <option value="">All</option>
            {branchOptions.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600, marginRight: 8 }}>Month:</label>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 16 }}>
            <option value="">All</option>
            {monthOptions.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Analytics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: 32,
          alignItems: 'stretch',
        }}
      >
        {/* Sales Chart */}
        <div style={{ background: '#f7fafd', borderRadius: 16, padding: 28, boxShadow: '0 2px 16px #b6d0f533', display: 'flex', flexDirection: 'column', minHeight: 340 }}>
          <h3 style={{ marginTop: 0, marginBottom: 18, fontSize: 22, fontWeight: 700, color: '#3182ce' }}>Estimated Sales (by Day)</h3>
          <div style={{ flex: 1, minHeight: 220 }}>
            <Line data={salesLineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
        {/* Low Stock Items */}
        <div style={{ background: '#fff5f5', borderRadius: 16, padding: 28, boxShadow: '0 2px 16px #feb2b233', display: 'flex', flexDirection: 'column', minHeight: 340 }}>
          <h3 style={{ marginTop: 0, marginBottom: 18, fontSize: 22, fontWeight: 700, color: '#c53030' }}>Low Stock Items (≤ 5)</h3>
          <div style={{ flex: 1 }}>
            {lowStock.length === 0 ? (
              <div style={{ color: '#888' }}>No low stock items.</div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {lowStock.map((p: any) => (
                  <li key={p.id} style={{ marginBottom: 10, fontWeight: 500, fontSize: 17 }}>
                    {p.name} <span style={{ color: '#c53030', fontWeight: 700 }}>(Stock: {p.stock})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Best Performing Items */}
        <div style={{ background: '#f0fff4', borderRadius: 16, padding: 28, boxShadow: '0 2px 16px #68d39133', display: 'flex', flexDirection: 'column', minHeight: 340 }}>
          <h3 style={{ marginTop: 0, marginBottom: 18, fontSize: 22, fontWeight: 700, color: '#276749' }}>Best Performing Items</h3>
          <div style={{ flex: 1, minHeight: 220 }}>
            <Bar data={bestItemsData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
        {/* Top Cashiers */}
        <div style={{ background: '#ebf8ff', borderRadius: 16, padding: 28, boxShadow: '0 2px 16px #63b3ed33', display: 'flex', flexDirection: 'column', minHeight: 340 }}>
          <h3 style={{ marginTop: 0, marginBottom: 18, fontSize: 22, fontWeight: 700, color: '#2b6cb0' }}>Top Cashiers (by Sales)</h3>
          <div style={{ flex: 1, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pie data={topCashiersData} options={{ responsive: true }} />
          </div>
        </div>
      </div>
    </div>
  );
} 