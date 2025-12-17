import React from 'react';
import './OperatorDataTable.css';

const OperatorDataTable = ({ 
  columns, 
  data, 
  loading, 
  emptyMessage = "Нет данных",
  onRowClick,
  actions,
  compact = false,
  autoHeight = false // НОВЫЙ ПРОПС: автоматическая высота
}) => {
  if (loading) {
    return (
      <div className="operator-data-table-loading">
        <div className="operator-loading-spinner">⟳</div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="operator-data-table-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`
      operator-data-table-container 
      ${compact ? 'operator-data-table-compact' : ''}
      ${autoHeight ? 'operator-data-table-container--auto-height' : ''}
    `}>
      <table className="operator-data-table">
        <thead className="operator-data-table-header">
          <tr>
            {columns.map(column => (
              <th key={column.key} className="operator-data-table-th">
                {column.title}
              </th>
            ))}
            {actions && <th className="operator-data-table-th operator-actions-column">Действия</th>}
          </tr>
        </thead>
        <tbody className="operator-data-table-body">
          {data.map((row, index) => (
            <tr 
              key={row.id || index}
              className={`operator-data-table-row ${onRowClick ? 'operator-data-table-row--clickable' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map(column => (
                <td key={column.key} className="operator-data-table-td">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
              {actions && (
                <td className="operator-data-table-td operator-actions-cell">
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

export default OperatorDataTable;