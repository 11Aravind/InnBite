import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiService } from '../../utils/apiService';
import { AdminSkeletonCards } from '../../components/AdminSkeletonTable';
import { Plus, Printer, Trash2, QrCode, Sparkles, ShieldOff, CheckCircle } from 'lucide-react';

export default function AdminTables() {
    const [tables, setTables] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newTableNum, setNewTableNum] = useState('');

    const loadData = async () => {
        setLoading(true);
        const [tablesData, settingsData] = await Promise.all([
            apiService.getTables(),
            apiService.getRestaurantSettings()
        ]);
        setTables(tablesData || []);
        setSettings(settingsData);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateTable = async (e) => {
        e.preventDefault();
        if (!newTableNum) return;
        await apiService.createTable(newTableNum);
        setNewTableNum('');
        loadData();
    };

    const handleToggleRevoked = async (tableId) => {
        await apiService.toggleTableRevoked(tableId);
        loadData();
    };

    const handleDeleteTable = async (id) => {
        if (window.confirm('Delete table assignment?')) {
            await apiService.deleteTable(id);
            loadData();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const baseUrl = window.location.origin;
    const isSelfService = settings?.service_mode === 'SELF_SERVICE';

    return (
        <div className="space-y-6 text-slate-900 font-sans">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-200 print:hidden">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            QR Code Management
                        </h1>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isSelfService ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-indigo-100 text-indigo-800 border-indigo-200'}`}>
                            {isSelfService ? 'SELF_SERVICE Mode' : 'TABLE_SERVICE Mode'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        {isSelfService
                            ? 'Single common QR code for whole hotel self-service ordering'
                            : 'Dedicated unique QR codes per table with live revocation control'
                        }
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {!isSelfService && (
                        <form onSubmit={handleCreateTable} className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Table #"
                                required
                                min="1"
                                value={newTableNum}
                                onChange={(e) => setNewTableNum(e.target.value)}
                                className="w-24 h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-900 focus:border-slate-900"
                            />
                            <button
                                type="submit"
                                className="h-10 px-4 bg-[#114536] hover:bg-[#0c382b] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4 text-emerald-200" /> Add Table
                            </button>
                        </form>
                    )}

                    <button
                        onClick={handlePrint}
                        className="h-10 px-4 bg-[#114536] hover:bg-[#0c382b] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4 text-emerald-200" />
                        <span>Print QR Cards</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <AdminSkeletonCards count={6} />
            ) : isSelfService ? (
                /* Common Self Service QR Card */
                <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center space-y-4 print:border-2 print:border-black">
                    <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-900 font-extrabold text-xs px-3 py-1.5 rounded-full border border-amber-200">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Hotel Common Self-Service QR
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block my-2">
                        <QRCodeSVG
                            value={`${baseUrl}/qr/common`}
                            size={200}
                            bgColor={"#ffffff"}
                            fgColor={"#0f172a"}
                            level={"H"}
                            includeMargin={false}
                        />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Scan to Order</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-1">
                            Customers scan this common QR code to get an independent session & unique order number.
                        </p>
                        <span className="text-xs text-slate-400 font-mono block mt-2 select-all">
                            {baseUrl}/qr/common
                        </span>
                    </div>
                </div>
            ) : (
                /* Table Service QR Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tables.map((tbl) => {
                        const qrUrl = `${baseUrl}/qr/${tbl.qr_code || tbl.id}`;
                        const isRevoked = tbl.revoked;

                        return (
                            <div
                                key={tbl.id}
                                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col items-center text-center justify-between print:border-2 print:border-black print:break-inside-avoid ${isRevoked ? 'border-rose-200 opacity-75 bg-rose-50/30' : 'border-slate-200/80 shadow-sm hover:shadow-md'
                                    }`}
                            >
                                <div className="w-full pb-3 border-b border-slate-100 mb-3 flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-amber-500" /> Table #{tbl.table_number}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteTable(tbl.id)}
                                        className="text-xs text-rose-500 hover:text-rose-700 font-bold print:hidden p-1"
                                        title="Delete table"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* QR Code SVG */}
                                <div className={`p-3 rounded-2xl border my-2 ${isRevoked ? 'bg-rose-100/50 border-rose-200 opacity-40' : 'bg-slate-50 border-slate-200'}`}>
                                    <QRCodeSVG
                                        value={qrUrl}
                                        size={140}
                                        bgColor={"#ffffff"}
                                        fgColor={isRevoked ? "#e11d48" : "#0f172a"}
                                        level={"H"}
                                        includeMargin={false}
                                    />
                                </div>

                                <div className="mt-2 space-y-1 w-full">
                                    <h2 className="text-xl font-black text-slate-900">Table #{tbl.table_number}</h2>

                                    {/* Revocation Status */}
                                    <div className="pt-2 flex items-center justify-center gap-2 print:hidden">
                                        <button
                                            onClick={() => handleToggleRevoked(tbl.id)}
                                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${isRevoked
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                                }`}
                                        >
                                            {isRevoked ? (
                                                <>
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    <span>Re-Activate QR</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldOff className="w-3.5 h-3.5 text-rose-600" />
                                                    <span>Revoke / Disable</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <span className="text-[10px] text-slate-400 font-mono block pt-1 truncate select-all">{qrUrl}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
