import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import CreateModal from './CreateModal';

export default function ReportsPage() {
    const [installments, setInstallments] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [selected, setSelected] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:5000/api/installments')
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                setInstallments(data);
                setFiltered(data);
            })
            .catch(err => {
                console.error('Ошибка при загрузке данных:', err);
                setInstallments([]);
                setFiltered([]);
            });
    }, []);

    function getPaymentStatus(item) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (Number(item.remainingAmount) === 0) {
            return { status: 'paid', daysLeft: 0 };
        }

        const paymentDay = Number(item.paymentDay);
        const currentPaymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
        currentPaymentDate.setHours(0, 0, 0, 0);

        const hasRecentPayment = item.payments.some(p => {
            const pDate = new Date(p.date);
            pDate.setHours(0, 0, 0, 0);
            return pDate >= currentPaymentDate && pDate.getMonth() === today.getMonth() && pDate.getFullYear() === today.getFullYear();
        });

        if (hasRecentPayment) {
            const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, paymentDay);
            nextMonthDate.setHours(0, 0, 0, 0);
            const daysLeft = Math.floor((nextMonthDate - today) / (1000 * 60 * 60 * 24));
            return { status: 'future', daysLeft };
        }

        const diffDays = Math.floor((currentPaymentDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return { status: 'today', daysLeft: 0 };
        if (diffDays === 1) return { status: 'tomorrow', daysLeft: 1 };
        if (diffDays < 0) return { status: 'overdue', daysLeft: -diffDays };
        return { status: 'future', daysLeft: diffDays };
    }


    const years = React.useMemo(() => {
        const allYears = new Set();
        installments.forEach(i => {
            i.payments.forEach(p => {
                if (p.date) {
                    const year = new Date(p.date).getFullYear();
                    allYears.add(year);
                }
            });
        });
        return Array.from(allYears).sort((a, b) => b - a);
    }, [installments]);

    const months = React.useMemo(() => {
        if (filterYear === 'all') return [];
        const allMonths = new Set();
        installments.forEach(i => {
            i.payments.forEach(p => {
                if (p.date) {
                    const d = new Date(p.date);
                    if (d.getFullYear() === Number(filterYear)) {
                        allMonths.add(d.getMonth() + 1);
                    }
                }
            });
        });
        return Array.from(allMonths).sort((a, b) => a - b);
    }, [installments, filterYear]);

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let filteredData = installments.filter(i => {
            const status = getPaymentStatus(i);

            if (filterType === 'today' && status.status !== 'today') return false;
            if (filterType === 'tomorrow' && status.status !== 'tomorrow') return false;
            if (filterType === 'overdue' && status.status !== 'overdue') return false;

            if (filterYear !== 'all') {
                const hasYear = i.payments.some(p => {
                    const pDate = new Date(p.date);
                    return pDate.getFullYear() === Number(filterYear);
                });
                if (!hasYear) return false;
            }

            if (filterMonth !== 'all' && filterYear !== 'all') {
                const hasMonth = i.payments.some(p => {
                    const pDate = new Date(p.date);
                    return (
                        pDate.getFullYear() === Number(filterYear) &&
                        pDate.getMonth() + 1 === Number(filterMonth)
                    );
                });
                if (!hasMonth) return false;
            }

            if (search.trim()) {
                const lowerSearch = search.toLowerCase();
                return (
                    i.name.toLowerCase().includes(lowerSearch) ||
                    i.code.toLowerCase().includes(lowerSearch) ||
                    i.customId?.toString().includes(search)
                );
            }

            return true;
        });

        filteredData.sort((a, b) => {
            const aStatus = getPaymentStatus(a);
            const bStatus = getPaymentStatus(b);

            const statusPriority = {
                overdue: 1,
                today: 2,
                tomorrow: 3,
                future: 4,
                paid: 5,
            };

            if (statusPriority[aStatus.status] !== statusPriority[bStatus.status]) {
                return statusPriority[aStatus.status] - statusPriority[bStatus.status];
            }

            return aStatus.daysLeft - bStatus.daysLeft;
        });

        setFiltered(filteredData);
    }, [search, filterType, filterYear, filterMonth, installments]);

    return (
        <div className="p-4">
            <div className="flex flex-wrap gap-3 mb-4 items-center">
                <input
                    type="text"
                    placeholder="Поиск по имени, коду, ID"
                    className="border p-2 rounded w-64"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="border p-2 rounded"
                >
                    <option value="all">Все</option>
                    <option value="today">Оплата сегодня</option>
                    <option value="tomorrow">Оплата завтра</option>
                    <option value="overdue">Просроченные</option>
                </select>

                <select
                    value={filterYear}
                    onChange={e => {
                        setFilterYear(e.target.value);
                        setFilterMonth('all');
                    }}
                    className="border p-2 rounded"
                >
                    <option value="all">Все года</option>
                    {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>

                <select
                    value={filterMonth}
                    onChange={e => setFilterMonth(e.target.value)}
                    className="border p-2 rounded"
                    disabled={filterYear === 'all'}
                >
                    <option value="all">Все месяцы</option>
                    {months.map(m => (
                        <option key={m} value={m}>
                            {m.toString().padStart(2, '0')}
                        </option>
                    ))}
                </select>

                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                >
                    Создать
                </button>
            </div>

            <div className="overflow-auto">
                <table className="w-full bg-white table-auto border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">Код</th>
                            <th className="p-2 border">ID</th>
                            <th className="p-2 border">Дата регистрации</th>
                            <th className="p-2 border">Имя</th>
                            <th className="p-2 border">Телефон</th>
                            <th className="p-2 border">Остаток</th>
                            <th className="p-2 border">Статус оплаты</th>
                            <th className="p-2 border">Подробнее</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(item => {
                            const { status, daysLeft } = getPaymentStatus(item);
                            let statusText = '';
                            let statusClass = '';

                            if (status === 'overdue') {
                                statusText = `Просрочено на ${daysLeft} дн.`;
                                statusClass = 'text-red-600 font-bold';
                            } else if (status === 'today') {
                                statusText = 'Оплата сегодня';
                                statusClass = 'text-yellow-600 font-semibold';
                            } else if (status === 'tomorrow') {
                                statusText = 'Оплата завтра';
                                statusClass = 'text-yellow-600 font-semibold';
                            } else if (status === 'future') {
                                statusText = `Оплата через ${daysLeft} дн.`;
                                statusClass = '';
                            } else if (status === 'paid') {
                                statusText = 'Оплачено';
                                statusClass = 'text-green-600 font-semibold';
                            }

                            const regDate = new Date(item.data_register);
                            const formattedRegDate = `${regDate.getDate().toString().padStart(2, '0')}.${(regDate.getMonth() + 1).toString().padStart(2, '0')}.${regDate.getFullYear()}`;

                            return (
                                <tr key={item._id}>
                                    <td className="p-2 border">{item.code}</td>
                                    <td className="p-2 border">{item.id}</td>
                                    <td className="p-2 border">{formattedRegDate}</td>
                                    <td className="p-2 border">{item.name}</td>
                                    <td className="p-2 border">{item.phoneNumber}</td>
                                    <td className="p-2 border">{item.remainingAmount}</td>
                                    <td className={`p-2 border ${statusClass}`}>{statusText}</td>
                                    <td className="p-2 border">
                                        <button
                                            onClick={() => setSelected(item)}
                                            className="px-3 py-1 bg-blue-600 text-white rounded"
                                        >
                                            Подробнее
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selected && (
                <Modal
                    data={selected}
                    onClose={() => setSelected(null)}
                    onUpdated={(updatedData) => {
                        setInstallments(prev =>
                            prev.map(i => i._id === updatedData._id ? updatedData : i)
                        );
                        setSelected(updatedData);
                    }}
                />
            )}

            {createModalOpen && (
                <CreateModal
                    onClose={() => setCreateModalOpen(false)}
                    onCreated={(newData) => {
                        setInstallments(prev => [...prev, newData]);
                        setCreateModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
