import React, { useState, useEffect } from 'react';
import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react';
import { CChartBar } from '@coreui/react-chartjs';

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, paymentsRes] = await Promise.all([
        fetch('https://cum-tel-server.onrender.com/api/cash/sessions/all'),
        fetch('https://cum-tel-server.onrender.com/api/cash/payments/all'),
      ]);
      const sessionsData = await sessionsRes.json();
      const paymentsData = await paymentsRes.json();

      setSessions(sessionsData);
      setPayments(paymentsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-center mt-8 text-gray-600">Загрузка статистики...</p>;
  }

  // Общие показатели
  const totalSessions = sessions.length;
  const totalIncome = payments.reduce((sum, p) => p.type === 'income' ? sum + p.amount : sum, 0);
  const totalExpense = payments.reduce((sum, p) => p.type === 'expense' ? sum + p.amount : sum, 0);
  const avgIncomePerSession = totalSessions ? (totalIncome / totalSessions).toFixed(2) : 0;
  const avgExpensePerSession = totalSessions ? (totalExpense / totalSessions).toFixed(2) : 0;

  // Подготовка данных для графика
  const last30Days = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    last30Days.push({ date: key, income: 0, expense: 0 });
  }

  payments.forEach(p => {
    const dateKey = new Date(p.date).toISOString().slice(0, 10);
    const day = last30Days.find(d => d.date === dateKey);
    if (day) {
      if (p.type === 'income') day.income += p.amount;
      else if (p.type === 'expense') day.expense += p.amount;
    }
  });

  // Форматируем даты для подписей по оси X (ДД.MM)
  const labels = last30Days.map(d =>
    new Date(d.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
  );

  const incomeData = last30Days.map(d => d.income);
  const expenseData = last30Days.map(d => d.expense);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Статистика касс</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div className="p-6 bg-green-50 rounded shadow text-center">
          <h2 className="text-lg font-semibold mb-2">Всего сессий</h2>
          <p className="text-4xl font-bold text-green-700">{totalSessions}</p>
        </div>
        <div className="p-6 bg-green-100 rounded shadow text-center">
          <h2 className="text-lg font-semibold mb-2">Общий приход</h2>
          <p className="text-4xl font-bold text-green-800">{totalIncome.toLocaleString()} сом</p>
        </div>
        <div className="p-6 bg-red-100 rounded shadow text-center">
          <h2 className="text-lg font-semibold mb-2">Общий расход</h2>
          <p className="text-4xl font-bold text-red-700">{totalExpense.toLocaleString()} сом</p>
        </div>
        <div className="p-6 bg-gray-100 rounded shadow text-center">
          <h2 className="text-lg font-semibold mb-2">Средний приход на сессию</h2>
          <p className="text-3xl font-bold">{avgIncomePerSession} сом</p>
          <h2 className="text-lg font-semibold mt-4 mb-2">Средний расход на сессию</h2>
          <p className="text-3xl font-bold">{avgExpensePerSession} сом</p>
        </div>
      </div>

      <CCard>
        <CCardHeader>Приход и расход за последние 30 дней</CCardHeader>
        <CCardBody>
          <CChartBar
            datasets={[
              {
                label: 'Приход',
                backgroundColor: '#22c55e',
                data: incomeData,
              },
              {
                label: 'Расход',
                backgroundColor: '#ef4444',
                data: expenseData,
              },
            ]}
            labels={labels}
            options={{
              scales: {
                x: {
                  stacked: true,
                  ticks: {
                    maxRotation: 90,
                    minRotation: 45,
                    maxTicksLimit: 15,
                  },
                },
                y: {
                  stacked: false,
                  beginAtZero: true,
                },
              },
              plugins: {
                legend: {
                  position: 'top',
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                },
              },
              responsive: true,
              maintainAspectRatio: false,
            }}
            style={{ height: '350px' }}
          />
        </CCardBody>
      </CCard>
    </div>
  );
};

export default Dashboard;
