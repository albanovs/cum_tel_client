import React, { useState } from 'react';
import axios from 'axios';

export default function CreateModal({ onClose, onCreated }) {
    const [form, setForm] = useState({
        id: '',
        code: '',
        name: '',
        phoneNumber: '',
        address: '',
        comment: '',
        phoneModel: '',
        phonePrice: '',
        installmentTerm: '', // для рассрочки
        paymentDay: '',      // день месяца оплаты
        firstPaymentDate: '',
        firstPaymentAmount: '',
        data_register: '',
        isInstallment: false, // выбор рассрочки или нет
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => {
            let newForm = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            };

            if (name === 'firstPaymentAmount') {
                if (value && !prev.firstPaymentDate) {
                    const today = new Date().toISOString().split('T')[0];
                    newForm.firstPaymentDate = today;
                }
                if (!value) {
                    newForm.firstPaymentDate = '';
                }
            }

            return newForm;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Проверка обязательных полей для рассрочки
            if (form.isInstallment) {
                if (!form.installmentTerm) {
                    setError('Укажите срок рассрочки');
                    setLoading(false);
                    return;
                }
                if (!form.paymentDay) {
                    setError('Укажите день месяца для оплаты');
                    setLoading(false);
                    return;
                }
            }

            // Формируем тело запроса
            const body = {
                id: form.id,
                code: form.code,
                name: form.name,
                phoneNumber: form.phoneNumber,
                address: form.address,
                comment: form.comment,
                phoneModel: form.phoneModel,
                phonePrice: parseFloat(form.phonePrice),
                data_register: form.data_register ? new Date(form.data_register) : new Date(),
                remainingAmount: 0,
                payments: [],
            };

            if (form.isInstallment) {
                body.installmentTerm = parseInt(form.installmentTerm);
                body.paymentDay = parseInt(form.paymentDay);
                const firstPaymentAmount = parseFloat(form.firstPaymentAmount) || 0;
                body.remainingAmount = parseFloat(form.phonePrice) - firstPaymentAmount;

                if (firstPaymentAmount > 0 && form.firstPaymentDate) {
                    body.payments.push({
                        amount: firstPaymentAmount,
                        date: new Date(form.firstPaymentDate),
                    });
                }
            } else {
                // Если не рассрочка, считаем что оплатили всю сумму сразу
                body.remainingAmount = 0;
                body.payments.push({
                    amount: parseFloat(form.phonePrice),
                    date: new Date(),
                });
            }

            const res = await axios.post('https://cum-tel-server.onrender.com/api/installments', body);

            onCreated(res.data);
        } catch (err) {
            console.error(err);
            setError('Ошибка при создании рассрочки.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded shadow w-full max-w-md relative max-h-[90vh] overflow-auto">
                <h2 className="text-xl font-semibold mb-4">Создать клиента</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                        <input
                            type="text"
                            name="id"
                            placeholder="ID (уникальный)"
                            value={form.id}
                            onChange={handleChange}
                            className="flex-1 border p-2 rounded"
                            required
                        />
                        <input
                            type="text"
                            name="code"
                            placeholder="Код (уникальный)"
                            value={form.code}
                            onChange={handleChange}
                            className="flex-1 border p-2 rounded"
                            required
                        />
                    </div>

                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                        <input
                            type="text"
                            name="name"
                            placeholder="Имя"
                            value={form.name}
                            onChange={handleChange}
                            className="flex-1 border p-2 rounded"
                            required
                        />
                        <input
                            type="text"
                            name="phoneNumber"
                            placeholder="Телефон"
                            value={form.phoneNumber}
                            onChange={handleChange}
                            className="flex-1 border p-2 rounded"
                        />
                    </div>

                    {/* Остальные поля */}
                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                        <input
                            type="text"
                            name="address"
                            placeholder="Адрес"
                            value={form.address}
                            onChange={handleChange}
                            className="flex-1 border p-2 rounded"
                        />
                        <input
                            type="text"
                            name="comment"
                            placeholder="Комментарий"
                            value={form.comment}
                            onChange={handleChange}
                            className="flex-1 border p-2 rounded"
                        />
                    </div>

                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                        <input
                            type="text"
                            name="phoneModel"
                            placeholder="Модель телефона"
                            value={form.phoneModel}
                            onChange={handleChange}
                            className="flex-1 border p-2 rounded"
                        />
                        <input
                            type="number"
                            name="phonePrice"
                            placeholder="Цена телефона"
                            value={form.phonePrice}
                            onChange={handleChange}
                            className="flex-1 border p-2 rounded"
                            required
                            min={0}
                            step="0.01"
                        />
                    </div>

                    {/* Выбор рассрочки */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="isInstallment"
                            checked={form.isInstallment}
                            onChange={handleChange}
                            id="isInstallment"
                        />
                        <label htmlFor="isInstallment">Рассрочка</label>
                    </div>

                    {/* Поля для рассрочки, если выбрана */}
                    {form.isInstallment && (
                        <>
                            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                                <input
                                    type="number"
                                    name="installmentTerm"
                                    placeholder="Срок рассрочки (месяцы)"
                                    value={form.installmentTerm}
                                    onChange={handleChange}
                                    className="flex-1 border p-2 rounded"
                                    min={1}
                                    required={form.isInstallment}
                                />
                                <input
                                    type="number"
                                    name="paymentDay"
                                    placeholder="День месяца для оплаты"
                                    value={form.paymentDay}
                                    onChange={handleChange}
                                    className="flex-1 border p-2 rounded"
                                    min={1}
                                    max={31}
                                    required={form.isInstallment}
                                />
                            </div>

                            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                                <input
                                    type="number"
                                    name="firstPaymentAmount"
                                    placeholder="Первоначальный платёж (необязательно)"
                                    value={form.firstPaymentAmount}
                                    onChange={handleChange}
                                    className="flex-1 border p-2 rounded"
                                    min={0}
                                    step="0.01"
                                />
                                <input
                                    type="date"
                                    name="firstPaymentDate"
                                    placeholder="Дата первого платежа"
                                    value={form.firstPaymentDate}
                                    onChange={handleChange}
                                    className="flex-1 border p-2 rounded"
                                    disabled={!form.firstPaymentAmount}
                                    required={!!form.firstPaymentAmount}
                                />
                            </div>
                        </>
                    )}

                    {/* Если без рассрочки, то нет необходимости вводить эти поля */}

                    {error && <div className="text-red-500">{error}</div>}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                            {loading ? 'Создание...' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}