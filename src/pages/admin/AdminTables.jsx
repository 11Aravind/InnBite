import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiService } from '../../utils/apiService';
import { AdminSkeletonCards } from '../../components/AdminSkeletonTable';
import { Plus, Printer, Trash2, QrCode, Sparkles } from 'lucide-react';

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
        <div className="space-y-6 text-slate-900">
            <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-200 print:hidden">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Table & QR Code Management <QrCode className="w-5 h-5 text-rose-500" />
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Generate, view, and print table QR codes for instant ordering</p>
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
                            className="w-24 h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none text-slate-900 focus:border-rose-500"
                        />
                        <button
                            type="submit"
                            className="h-10 px-4 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" /> Add Table
                        </button>
                    </form>

                    <button
                        onClick={handlePrint}
                        className="h-10 px-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Print All QR Cards</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <AdminSkeletonCards count={8} />
            ) : tables.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">No tables registered</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tables.map((tbl) => {
                        const qrUrl = `${baseUrl}/?table=${tbl.table_number}`;

                        return (
                            <div
                                key={tbl.id}
                                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center justify-between print:border-2 print:border-black print:break-inside-avoid"
                            >
                                <div className="w-full pb-3 border-b border-slate-100 mb-3 flex items-center justify-between">
                                    <span className="text-xs font-black text-rose-500 tracking-wider uppercase flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> InnBite Table
                                    </span>
                                    <button
                                        onClick={() => handleDeleteTable(tbl.id)}
                                        className="text-xs text-rose-500 hover:text-rose-700 font-bold print:hidden p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* QR Code SVG */}
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 my-2">
                                    <QRCodeSVG
                                        value={qrUrl}
                                        size={140}
                                        bgColor={"#ffffff"}
                                        fgColor={"#0f172a"}
                                        level={"H"}
                                        includeMargin={false}
                                    />
                                </div>

                                <div className="mt-3">
                                    <h2 className="text-2xl font-black text-slate-900">Table #{tbl.table_number}</h2>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Scan to View Menu & Order</p>
                                    <span className="text-[10px] text-slate-400 font-mono block mt-1 select-all">{qrUrl}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
