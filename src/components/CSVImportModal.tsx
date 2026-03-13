
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { formatCurrency } from '../utils/helpers';
import { Transaction } from '../types';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Omit<Transaction, 'id' | 'createdAt' | 'userId'>[];
  onConfirm: (data: Omit<Transaction, 'id' | 'createdAt' | 'userId'>[]) => void;
}

export function CSVImportModal({ isOpen, onClose, data, onConfirm }: CSVImportModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Preview Import Data">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          We found {data.length} transactions. Please review them before importing.
        </p>
        
        <div className="max-h-96 overflow-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold sticky top-0">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((t, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-2 whitespace-nowrap">{t.date}</td>
                  <td className="px-4 py-2 font-medium truncate max-w-[150px]">{t.title}</td>
                  <td className="px-4 py-2">{t.category}</td>
                  <td className="px-4 py-2 text-right font-semibold text-rose-600">
                    {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(data)}>
            Confirm Import
          </Button>
        </div>
      </div>
    </Modal>
  );
}
