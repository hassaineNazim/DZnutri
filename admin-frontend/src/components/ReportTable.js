import { Eye } from 'lucide-react';
import { StatePanel } from './AdminUI';

const ReportTable = ({ data, columns, onAction, actionLabel = 'Voir' }) => {
  if (!data || data.length === 0) {
    return <StatePanel>Aucune donnée à afficher.</StatePanel>;
  }

  return (
    <div className="admin-table-shell">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column.header}>{column.header}</th>)}
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr key={item.id || item.code || rowIndex}>
              {columns.map((column) => (
                <td key={column.header}>
                  {column.render ? column.render(item) : item[column.accessor]}
                </td>
              ))}
              <td style={{ textAlign: 'right' }}>
                <button type="button" onClick={() => onAction(item)} className="admin-table-action">
                  <Eye size={16} aria-hidden="true" />
                  {actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;
