import { Eye } from 'lucide-react';

const ReportTable = ({ data, columns, onAction, actionLabel = "Voir" }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">Aucune donnée à afficher.</p>
            </div>
        );
    }

    return (
        <div className="bg-red-500 shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {col.header}
                            </th>
                        ))}
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item, rowIndex) => (
                        <tr key={item.id || rowIndex} className="hover:bg-gray-50">
                            {columns.map((col, colIndex) => (
                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {col.render ? col.render(item) : item[col.accessor]}
                                </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => onAction(item)}
                                    className="text-blue-600 hover:text-blue-900 flex items-center justify-end"
                                >
                                    <Eye className="h-4 w-4 mr-1" />
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
