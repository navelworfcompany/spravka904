// src/admin/components/UI/DataTable.js
import React from 'react';
import './DataTable.css';

const DataTable = ({ 
  columns, 
  data, 
  loading, 
  emptyMessage = "Нет данных",
  onRowClick,
  actions 
}) => {
  if (loading) {
    return (
      <div className="data-table-loading">
        <div className="loading-spinner">⟳</div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="data-table-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead className="data-table-header">
          <tr>
            {columns.map(column => (
              <th key={column.key} className="data-table-th">
                {column.title}
              </th>
            ))}
            {actions && <th className="data-table-th actions-column">Действия</th>}
          </tr>
        </thead>
        <tbody className="data-table-body">
          {data.map((row, index) => (
            <tr 
              key={row.id || index}
              className={`data-table-row ${onRowClick ? 'data-table-row--clickable' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map(column => (
                <td key={column.key} className="data-table-td">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
              {actions && (
                <td className="data-table-td actions-cell">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;