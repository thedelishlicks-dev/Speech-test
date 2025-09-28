
import React from 'react';
import { Transaction, TransactionType } from '../types';

interface ConfirmationViewProps {
  transaction: Omit<Transaction, 'id'>;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: () => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-900">{value}</dd>
  </div>
);

const ConfirmationView: React.FC<ConfirmationViewProps> = ({ transaction, onConfirm, onCancel, onEdit }) => {
  const amountColor = transaction.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600';
  const sign = transaction.type === TransactionType.INCOME ? '+' : '-';

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 text-center">Confirm Transaction</h3>
        </div>
        <dl className="p-4">
          <DetailRow label="Date" value={transaction.date} />
          <DetailRow label="Description" value={<span className="font-semibold">{transaction.description}</span>} />
          <DetailRow label="Category" value={transaction.category} />
          <DetailRow
            label="Amount"
            value={
              <span className={`font-bold ${amountColor}`}>
                {sign} ₹{transaction.amount.toFixed(2)}
              </span>
            }
          />
          <DetailRow
            label="Type"
            value={
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  transaction.type === TransactionType.INCOME
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {transaction.type}
              </span>
            }
          />
        </dl>
        <div className="p-4 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationView;
