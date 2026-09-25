import React, { useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import AdminSkeletonTable from './AdminSkeletonTable';

export default function DataTable({
    data,
    columns,
    loading = false,
    searchQuery = '',
    onSearchQueryChange = null,
    searchPlaceholder = 'Search...',
    pageSizeOptions = [5, 10, 20, 50],
    defaultPageSize = 10,
    emptyMessage = 'No records found',
    emptyIcon: EmptyIcon = null,
    extraHeaderControls = null
}) {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const activeFilter = onSearchQueryChange !== null ? searchQuery : globalFilter;
    const setActiveFilter = onSearchQueryChange !== null ? onSearchQueryChange : setGlobalFilter;

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter: activeFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setActiveFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: defaultPageSize,
            },
        },
    });

    const pageSize = table.getState().pagination.pageSize;
    const pageIndex = table.getState().pagination.pageIndex;
    const totalRows = table.getFilteredRowModel().rows.length;
    const startIndex = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
    const endIndex = Math.min((pageIndex + 1) * pageSize, totalRows);
    const pageCount = table.getPageCount();

    return (
        <div className="space-y-4 font-sans text-slate-900">
            {/* Filter & Controls Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={activeFilter ?? ''}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        className="w-full h-10 bg-slate-50 border border-slate-200 pl-4 pr-4 rounded-xl text-xs font-medium outline-none focus:border-rose-500 text-slate-900 transition-colors"
                    />
                </div>

                {/* Additional Filter Dropdowns & Per Page Selector */}
                <div className="flex flex-wrap items-center gap-2">
                    {extraHeaderControls}

                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
                        <span className="text-slate-500 font-semibold">Per Page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => table.setPageSize(Number(e.target.value))}
                            className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table or Skeleton Loader */}
            {loading ? (
                <AdminSkeletonTable rows={pageSize} cols={columns.length} />
            ) : totalRows === 0 ? (
                <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200">
                    {EmptyIcon && <EmptyIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />}
                    <p className="font-bold text-slate-800 text-base">{emptyMessage}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id} className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                                        {headerGroup.headers.map((header) => {
                                            const canSort = header.column.getCanSort();
                                            return (
                                                <th
                                                    key={header.id}
                                                    style={{ width: header.column.columnDef.size }}
                                                    className={`py-3.5 px-4 ${header.column.columnDef.meta?.headerAlign === 'right' ? 'text-right' : 'text-left'}`}
                                                >
                                                    {header.isPlaceholder ? null : (
                                                        <div
                                                            className={`inline-flex items-center gap-1.5 ${canSort ? 'cursor-pointer select-none hover:text-slate-900' : ''}`}
                                                            onClick={header.column.getToggleSortingHandler()}
                                                        >
                                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                                            {canSort && (
                                                                <span className="text-slate-400">
                                                                    {{
                                                                        asc: <ArrowUp className="w-3 h-3 text-rose-500" />,
                                                                        desc: <ArrowDown className="w-3 h-3 text-rose-500" />
                                                                    }[header.column.getIsSorted()] ?? <ArrowUpDown className="w-3 h-3 opacity-40" />}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className={`py-3 px-4 ${cell.column.columnDef.meta?.align === 'right' ? 'text-right' : ''}`}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls Footer */}
                    <div className="bg-slate-50 px-4 py-3.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="text-slate-500 font-medium">
                            Showing <span className="font-bold text-slate-900">{startIndex}</span> to{' '}
                            <span className="font-bold text-slate-900">{endIndex}</span> of{' '}
                            <span className="font-bold text-slate-900">{totalRows}</span> records
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: pageCount }, (_, i) => i).map((pIdx) => (
                                    <button
                                        key={pIdx}
                                        onClick={() => table.setPageIndex(pIdx)}
                                        className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors ${
                                            pageIndex === pIdx
                                                ? 'bg-rose-500 text-white shadow-2xs'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {pIdx + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
