import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../utils/apiService';
import { updateCustomerSessionTable } from '../utils/session';
import { QrCode, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function QRHandler() {
    const { qrCode, tableId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const targetCode = qrCode || tableId || searchParams.get('qr') || searchParams.get('table');

    const [status, setStatus] = useState('validating'); // 'validating' | 'success' | 'invalid'
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!targetCode) {
            setStatus('invalid');
            setErrorMessage('No QR code parameter was provided.');
            return;
        }

        let isMounted = true;

        apiService.validateQRCode(targetCode)
            .then(res => {
                if (!isMounted) return;

                if (res.valid) {
                    setStatus('success');
                    updateCustomerSessionTable(
                        res.table_id,
                        res.table_number,
                        res.type || 'TABLE_SERVICE'
                    );
                    if (res.table_number) {
                        localStorage.setItem('orderly_table_number', String(res.table_number));
                    }
                    // Redirect to Customer Menu
                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 400);
                } else {
                    setStatus('invalid');
                    setErrorMessage(res.reason || 'This QR code is no longer available. Please contact staff.');
                }
            })
            .catch(err => {
                if (!isMounted) return;
                setStatus('invalid');
                setErrorMessage('Unable to validate QR code. Please contact staff.');
            });

        return () => {
            isMounted = false;
        };
    }, [targetCode, navigate]);

    if (status === 'validating') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
                <div className="text-center">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce shadow-lg">
                        <QrCode className="w-8 h-8" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Validating QR Code...</h2>
                    <p className="text-slate-500 text-xs mt-1">Connecting to restaurant session</p>
                </div>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="min-h-screen bg-rose-50/50 flex items-center justify-center p-4 font-sans">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-sm">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid or Revoked QR</h2>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                        {errorMessage}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-all shadow-md"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Return to Main Menu</span>
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
