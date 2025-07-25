import React, { useState, useEffect } from 'react';

const TELEGRAM_BOT_TOKEN = '8396661511:AAHXdQYMm_NPAN1hbFw2Owmn6kgsJ6_j2T0'; // <-- сюда вставьте ваш токен
const TELEGRAM_CHAT_ID = '-4938428460'; // <-- или числовой chat_id канала/чата

async function sendTelegramMessage(text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text,
                parse_mode: 'HTML',
            }),
        });
        if (!res.ok) {
            const errorData = await res.json();
            console.error('Ошибка Telegram API:', errorData);
        }
    } catch (e) {
        console.error('Ошибка при отправке сообщения в Telegram:', e);
    }
}

export default function CashierScreen() {
    const [sessionId, setSessionId] = useState(null);
    const [sessionClosed, setSessionClosed] = useState(false);
    const [incomeAmount, setIncomeAmount] = useState('');
    const [incomeComment, setIncomeComment] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseComment, setExpenseComment] = useState('');
    const [todayIncomes, setTodayIncomes] = useState([]);
    const [todayExpenses, setTodayExpenses] = useState([]);

    const today = new Date().toISOString().slice(0, 10);

    const openCashSession = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/cash/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ openedAt: new Date().toISOString() }),
            });
            if (!res.ok) throw new Error('Ошибка при открытии кассы');
            const data = await res.json();
            setSessionId(data._id);
            setSessionClosed(false);
            fetchTodayPayments();

            sendTelegramMessage(
                `<b>Касса открыта</b>\nДата: ${new Date(data.openedAt).toLocaleString('ru-RU')}`
            );
        } catch (err) {
            console.error(err);
            alert('Не удалось открыть кассу');
        }
    };

    const closeCashSession = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/cash/sessions/${sessionId}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ closedAt: new Date().toISOString() }),
            });
            if (!res.ok) throw new Error('Ошибка при закрытии кассы');

            setSessionClosed(true);
            setSessionId(null);

            sendTelegramMessage(
                `<b>Касса закрыта</b>\nДата: ${new Date().toLocaleString('ru-RU')}`
            );
        } catch (err) {
            console.error(err);
            alert('Не удалось закрыть кассу');
        }
    };

    const fetchTodayPayments = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/cash/payments?date=${today}`);
            if (!res.ok) throw new Error('Ошибка при загрузке данных');
            const data = await res.json();
            setTodayIncomes(data.filter((p) => p.type === 'income'));
            setTodayExpenses(data.filter((p) => p.type === 'expense'));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (sessionId) {
            fetchTodayPayments();
        }
    }, [sessionId]);

    const handleAddPayment = async (type) => {
        const amount = type === 'income' ? incomeAmount : expenseAmount;
        const comment = type === 'income' ? incomeComment : expenseComment;

        if (!amount) return alert('Введите сумму');

        try {
            const res = await fetch('http://localhost:5000/api/cash/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    type,
                    amount: Number(amount),
                    comment,
                    date: new Date().toISOString(),
                }),
            });
            if (!res.ok) throw new Error('Ошибка при сохранении');

            if (type === 'income') {
                setIncomeAmount('');
                setIncomeComment('');
            } else {
                setExpenseAmount('');
                setExpenseComment('');
            }

            fetchTodayPayments();

            sendTelegramMessage(
                `<b>Новая запись в кассу</b>\nТип: ${type === 'income' ? 'Приход' : 'Расход'}\n` +
                `Сумма: ${amount} сом\n` +
                (comment ? `Комментарий: ${comment}\n` : '') +
                `Время: ${new Date().toLocaleString('ru-RU')}`
            );
        } catch (err) {
            console.error(err);
            alert('Не удалось сохранить');
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            {!sessionId ? (
                <button
                    onClick={openCashSession}
                    className="w-full py-3 bg-blue-600 text-white rounded text-lg hover:bg-blue-700 transition"
                >
                    Открыть кассу
                </button>
            ) : (
                <>
                    <h2 className="text-xl font-bold mb-4">Касса открыта</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Приход */}
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-lg font-semibold mb-2">Приход</h3>
                            <input
                                type="number"
                                value={incomeAmount}
                                onChange={(e) => setIncomeAmount(e.target.value)}
                                placeholder="Сумма"
                                className="w-full border p-2 mb-2 rounded"
                                min="0"
                            />
                            <input
                                type="text"
                                value={incomeComment}
                                onChange={(e) => setIncomeComment(e.target.value)}
                                placeholder="Комментарий"
                                className="w-full border p-2 mb-2 rounded"
                            />
                            <button
                                onClick={() => handleAddPayment('income')}
                                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                            >
                                Ввести
                            </button>
                        </div>

                        {/* Расход */}
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-lg font-semibold mb-2">Расход</h3>
                            <input
                                type="number"
                                value={expenseAmount}
                                onChange={(e) => setExpenseAmount(e.target.value)}
                                placeholder="Сумма"
                                className="w-full border p-2 mb-2 rounded"
                                min="0"
                            />
                            <input
                                type="text"
                                value={expenseComment}
                                onChange={(e) => setExpenseComment(e.target.value)}
                                placeholder="Комментарий"
                                className="w-full border p-2 mb-2 rounded"
                            />
                            <button
                                onClick={() => handleAddPayment('expense')}
                                className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
                            >
                                Ввести
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={closeCashSession}
                        className="w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-800 mb-8 transition"
                    >
                        Закрыть кассу
                    </button>

                    {/* Сегодняшние оплаты */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-100 rounded p-4 max-h-64 overflow-y-auto">
                            <h4 className="font-semibold mb-2">Сегодняшние приходы</h4>
                            {todayIncomes.length > 0 ? (
                                <ul className="text-sm divide-y">
                                    {todayIncomes.map((p, i) => (
                                        <li key={i} className="py-2">
                                            <div className="flex justify-between">
                                                <span>{p.amount} сом</span>
                                                <span>{new Date(p.date).toLocaleTimeString('ru-RU')}</span>
                                            </div>
                                            {p.comment && <div className="text-xs text-gray-600">{p.comment}</div>}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-sm">Нет приходов</p>
                            )}
                        </div>

                        <div className="bg-gray-100 rounded p-4 max-h-64 overflow-y-auto">
                            <h4 className="font-semibold mb-2">Сегодняшние расходы</h4>
                            {todayExpenses.length > 0 ? (
                                <ul className="text-sm divide-y">
                                    {todayExpenses.map((p, i) => (
                                        <li key={i} className="py-2">
                                            <div className="flex justify-between">
                                                <span>{p.amount} сом</span>
                                                <span>{new Date(p.date).toLocaleTimeString('ru-RU')}</span>
                                            </div>
                                            {p.comment && <div className="text-xs text-gray-600">{p.comment}</div>}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-sm">Нет расходов</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

