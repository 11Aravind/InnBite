import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiService } from '../../utils/apiService';

export default function AdminTables() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTableNum, setNewTableNum] = useState('');

    const loadTables = async () => {
        setLoading(true);
        const data = await apiService.getTables();
        setTables(data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadTables();
    }, []);

    const handleCreateTable = async (e) => {
        e.preventDefault();
        if (!newTableNum) return;
        await apiService.createTable(newTableNum);
        setNewTableNum('');
        loadTables();
    };

    const handleDeleteTable = async (id) => {
        if (window.confirm('Delete table assignment?')) {
            await apiService.deleteTable(id);
            loadTables();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const baseUrl = window.location.origin;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Table & QR Code Management</h1>
                    <p className="text-xs text-gray-500">Generate, view, and print table QR codes for instant ordering</p>
                </div>

                <div className="flex items-center gap-3">
                    <form onSubmit={handleCreateTable} className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="Table #"
                            required
                            min="1"
                            value={newTableNum}
                            onChange={(e) => setNewTableNum(e.target.value)}
                            className="w-24 h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-black"
                        />
                        <button
                            type="submit"
                            className="h-10 px-4 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800"
                        >
                            + Add Table
                        </button>
                    </form>

                    <button
                        onClick={handlePrint}
                        className="h-10 px-4 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-amber-400 flex items-center gap-2"
                    >
                        <span>🖨️ Print All QR Cards</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading tables...</div>
            ) : tables.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">No tables registered</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tables.map((tbl) => {
                        const qrUrl = `${baseUrl}/?table=${tbl.table_number}`;

                        return (
                            <div
                                key={tbl.id}
                                className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col items-center text-center justify-between print:border-2 print:border-black print:break-inside-avoid"
                            >
                                <div className="w-full pb-3 border-b border-gray-100 mb-3 flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-600 tracking-wider uppercase">Orderly Table</span>
                                    <button
                                        onClick={() => handleDeleteTable(tbl.id)}
                                        className="text-xs text-red-500 hover:text-red-700 font-bold print:hidden"
                                    >
                                        Delete
                                    </button>
                                </div>

                                {/* QR Code SVG */}
                                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 my-2">
                                    <QRCodeSVG
                                        value={qrUrl}
                                        size={140}
                                        bgColor={"#ffffff"}
                                        fgColor={"#171212"}
                                        level={"H"}
                                        includeMargin={false}
                                    />
                                </div>

                                <div className="mt-3">
                                    <h2 className="text-2xl font-black text-gray-900">Table #{tbl.table_number}</h2>
                                    <p className="text-[11px] text-gray-500 mt-0.5">Scan to View Menu & Order</p>
                                    <span className="text-[10px] text-gray-400 font-mono block mt-1 select-all">{qrUrl}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
