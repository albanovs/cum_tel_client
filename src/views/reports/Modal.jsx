import React, { useState, useEffect } from 'react';

export default function Modal({ data, onClose, onUpdated }) {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [nextPaymentDate, setNextPaymentDate] = useState(null);

    const paymentDay = data.paymentDay;
    const isPaidOff = Number(data.remainingAmount) === 0;

    // Функция для вычисления следующей даты оплаты относительно текущей даты
    function getNextPaymentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        let nextDate = new Date(year, month, paymentDay);
        nextDate.setHours(0, 0, 0, 0);

        if (today > nextDate) {
            nextDate = new Date(year, month + 1, paymentDay);
            nextDate.setHours(0, 0, 0, 0);
        }
        return nextDate;
    }

    useEffect(() => {
        if (!isPaidOff) {
            setNextPaymentDate(getNextPaymentDate());
        }
    }, [data.payments, isPaidOff]);

    const handleSubmit = async () => {
        if (!amount) {
            alert('Введите сумму оплаты');
            return;
        }

        try {
            const selectedDate = new Date(date);
            selectedDate.setHours(0, 0, 0, 0);

            // Получаем дату плановой оплаты относительно выбранной даты
            // Чтобы не привязываться к текущему месяцу, пересчитаем на месяц выбранной даты
            function getScheduledDateForPayment(selectedDate, paymentDay) {
                const year = selectedDate.getFullYear();
                const month = selectedDate.getMonth();

                let scheduledDate = new Date(year, month, paymentDay);
                scheduledDate.setHours(0, 0, 0, 0);

                if (scheduledDate < selectedDate) {
                    // Если дата оплаты уже была в этом месяце, берем следующую дату
                    scheduledDate = new Date(year, month + 1, paymentDay);
                    scheduledDate.setHours(0, 0, 0, 0);
                }
                return scheduledDate;
            }

            const scheduledDate = getScheduledDateForPayment(selectedDate, paymentDay);

            let overdueDays = 0;
            let comment = '';

            if (selectedDate > scheduledDate) {
                const diffTime = selectedDate - scheduledDate;
                overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                comment = `Просрочено на ${overdueDays} дн.`;
            }

            const res = await fetch(`http://localhost:5000/api/installments/${data._id}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(amount),
                    date,
                    ...(comment && { comment }),
                }),
            });

            if (!res.ok) throw new Error('Ошибка при отправке оплаты');
            const updated = await res.json();
            onUpdated(updated);

            setAmount('');
            setDate(new Date().toISOString().slice(0, 10));
            setNextPaymentDate(getNextPaymentDate());
        } catch (err) {
            console.error(err);
            alert('Ошибка при отправке оплаты');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded shadow-lg z-[999] max-w-lg w-full overflow-auto">
                <div className="flex justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold mb-4">Данные клиента</h2>
                        <p><strong>Имя:</strong> {data.name}</p>
                        <p><strong>Телефон:</strong> {data.phoneNumber}</p>
                        <p><strong>Модель телефона:</strong> {data.phoneModel}</p>
                        <p><strong>Цена:</strong> {data.phonePrice}</p>
                        <p><strong>Остаток:</strong> {data.remainingAmount}</p>

                        {isPaidOff && (
                            <p className="text-green-700 font-semibold mt-2">
                                ✅ Оплата завершена
                            </p>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mt-4 mb-2">Оплаты</h3>
                        <div>
                            {data.payments && data.payments.length > 0 ? (
                                <ul className="overflow-y-scroll h-40 py-10">
                                    {data.payments.map((payment, index) => (
                                        <li
                                            key={index}
                                            style={{ fontSize: '10px' }}
                                            className="p-3 py-1 flex flex-col border"
                                        >
                                            <div className="flex gap-2">
                                                <span>Сумма: {payment.amount} сом</span>
                                                <span>Дата: {new Date(payment.date).toLocaleDateString('ru-RU')}</span>
                                            </div>
                                            {payment.comment && (
                                                <div className="text-red-500">{payment.comment}</div>
                                            )}
                                        </li>
                                    ))}

                                    <li className="mt-2 font-semibold text-sm text-right text-green-700">
                                        Итого оплачено: {data.payments.reduce((sum, p) => sum + Number(p.amount), 0)} сом
                                    </li>
                                </ul>
                            ) : (
                                <p>Оплат пока нет</p>
                            )}
                        </div>
                    </div>
                </div>

                {!isPaidOff && (
                    <>
                        <p className="mb-4 font-medium mt-4">
                            Следующая оплата: <span className="text-blue-600">{nextPaymentDate?.toLocaleDateString('ru-RU')}</span>
                        </p>

                        <h3 className="text-lg font-semibold mt-4 mb-2">Внести оплату</h3>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Сумма"
                            className="border p-2 w-full mb-2 rounded"
                        />
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="border p-2 w-full mb-4 rounded"
                        />
                    </>
                )}

                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
                        Отмена
                    </button>
                    {!isPaidOff && (
                        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">
                            Внести
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
