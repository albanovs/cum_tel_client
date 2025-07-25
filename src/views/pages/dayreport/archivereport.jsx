import React, { useEffect, useState } from 'react';

export default function CashReportScreen() {
    const [sessions, setSessions] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        applyDateFilter();
    }, [sessions, dateFrom, dateTo]);

    const fetchSessions = async () => {
        try {
            const res = await fetch('https://cum-tel-server.onrender.com/api/cash/sessions/all');
            const data = await res.json();
            setSessions(data);
        } catch (err) {
            console.error(err);
        }
    };

    const applyDateFilter = () => {
        let filtered = sessions;

        if (dateFrom) {
            const from = new Date(dateFrom);
            filtered = filtered.filter(s => new Date(s.openedAt) >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            // Для включения всего дня "до" добавим 1 день минус 1 мс
            to.setHours(23, 59, 59, 999);
            filtered = filtered.filter(s => new Date(s.openedAt) <= to);
        }

        setFilteredSessions(filtered);
    };

    const openDetailsModal = async (session) => {
        setLoadingPayments(true);
        setSelectedSession(session);
        try {
            const res = await fetch(`https://cum-tel-server.onrender.com/api/cash/sessions/${session._id}/payments`);
            const data = await res.json();
            setPayments(data);
        } catch (err) {
            console.error(err);
            setPayments([]);
        } finally {
            setLoadingPayments(false);
        }
    };

    const closeModal = () => {
        setSelectedSession(null);
        setPayments([]);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
            <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">
                Отчёты по кассам
            </h1>

            {/* Фильтр по дате */}
            <div className="flex flex-col sm:flex-row items-center justify-center mb-6 space-y-3 sm:space-y-0 sm:space-x-4">
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="dateFrom">
                        Дата с
                    </label>
                    <input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="dateTo">
                        Дата по
                    </label>
                    <input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                </div>
                <button
                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                    className="mt-4 sm:mt-0 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                >
                    Сбросить фильтр
                </button>
            </div>

            <div className="overflow-x-auto border rounded-lg shadow-md">
                <table className="w-full text-left text-sm sm:text-base">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 min-w-[140px]">Дата</th>
                            <th className="p-3 text-right min-w-[100px]">Приход</th>
                            <th className="p-3 text-right min-w-[100px]">Расход</th>
                            <th className="p-3 text-center min-w-[80px]">Детали</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSessions.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-4 text-center text-gray-500">
                                    Нет данных для отображения
                                </td>
                            </tr>
                        ) : (
                            filteredSessions.map((session) => {
                                const income = session.totalIncome || 0;
                                const expense = session.totalExpense || 0;
                                const date = new Date(session.openedAt).toLocaleDateString('ru-RU');

                                return (
                                    <tr
                                        key={session._id}
                                        className="border-t bg-white hover:bg-gray-50 cursor-pointer"
                                    >
                                        <td className="p-3">{date}</td>
                                        <td className="p-3 text-right text-green-700 font-semibold">{income} сом</td>
                                        <td className="p-3 text-right text-red-600 font-semibold">{expense} сом</td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => openDetailsModal(session)}
                                                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                                            >
                                                Детально
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Модалка */}
            {selectedSession && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    onClick={closeModal} // закрытие по клику вне модалки
                >
                    <div
                        className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6"
                        onClick={(e) => e.stopPropagation()} // чтобы клик внутри не закрывал модалку
                    >
                        <h2
                            id="modal-title"
                            className="text-xl font-bold mb-4 border-b pb-2"
                        >
                            Детали сессии от{' '}
                            {new Date(selectedSession.openedAt).toLocaleDateString('ru-RU')}
                        </h2>

                        {loadingPayments ? (
                            <p className="text-center text-gray-600">Загрузка данных...</p>
                        ) : payments.length === 0 ? (
                            <p className="text-center text-gray-500">Нет оплат и расходов</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {payments.map((p) => (
                                    <li
                                        key={p._id}
                                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span
                                                className={`inline-block px-2 py-1 rounded text-xs font-semibold ${p.type === 'income'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {p.type === 'income' ? 'Приход' : 'Расход'}
                                            </span>
                                            <span
                                                className={`font-semibold ${p.type === 'income' ? 'text-green-700' : 'text-red-700'
                                                    }`}
                                            >
                                                {p.amount} сом
                                            </span>
                                        </div>
                                        <div className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-0 sm:ml-auto">
                                            {new Date(p.date).toLocaleTimeString('ru-RU')}
                                        </div>
                                        {p.comment && (
                                            <div className="mt-1 text-gray-500 text-sm sm:ml-6 sm:mt-0 sm:flex-1">
                                                {p.comment}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <button
                            onClick={closeModal}
                            className="mt-6 w-full sm:w-auto px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}