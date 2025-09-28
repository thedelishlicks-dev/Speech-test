
import React from 'react';
import { Transaction, TransactionType } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionRow: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const amountColor = transaction.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600';
  const sign = transaction.type === TransactionType.INCOME ? '+' : '-';

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-3 px-4 text-sm text-gray-700">{transaction.date}</td>
      <td className="py-3 px-4 text-sm text-gray-800 font-medium">{transaction.description}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{transaction.category}</td>
      <td className={`py-3 px-4 text-sm font-semibold ${amountColor}`}>
        {sign} ₹{transaction.amount.toFixed(2)}
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            transaction.type === TransactionType.INCOME
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {transaction.type}
        </span>
      </td>
    </tr>
  );
};

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length > 0 ? (
              transactions.map((tx) => <TransactionRow key={tx.id} transaction={tx} />)
            ) : (
              <tr>
                <td colSpan={5} className="py-8 px-4 text-center text-gray-500">
                  No transactions yet. Press the microphone to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
