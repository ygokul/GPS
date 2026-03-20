import React from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
}

function DataTable<T extends { id: string | number }>({ data, columns, isLoading, onRowClick }: DataTableProps<T>) {
  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading data...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500">No records found.</div>;
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-4 py-3 font-medium ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
          {data.map((item) => (
            <tr 
              key={item.id} 
              onClick={() => onRowClick && onRowClick(item)}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" : ""}
            >
              {columns.map((col, idx) => (
                <td key={idx} className={`px-4 py-3 ${col.className || ''}`}>
                  {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
