import { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { FamilyMember } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  UsersIcon,
  Trash2Icon,
  ArrowRightLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  WalletIcon,
  UserPlusIcon,
  SendIcon,
  HistoryIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BanknoteIcon
} from 'lucide-react';

interface FamilyWalletProps {
  familyMembers: FamilyMember[];
  currentBudget: number;
  onAddMember: (name: string, balance: number) => void;
  onRemoveMember: (id: string) => void;
  onModifyAmount: (id: string, amount: number, type: 'deposit' | 'withdraw', description?: string) => void;
  onTransferBetweenFamily: (fromId: string, toId: string, amount: number) => void;
  onTransferFamilyToMain: (memberId: string, amount: number) => void;
  onTransferMainToFamily: (memberId: string, amount: number) => void;
}

type ModalType = 'add' | 'deposit' | 'withdraw' | 'transfer' | 'toMain' | 'fromMain' | null;

export function FamilyWallet({
  familyMembers,
  currentBudget,
  onAddMember,
  onRemoveMember,
  onModifyAmount,
  onTransferBetweenFamily,
  onTransferFamilyToMain,
  onTransferMainToFamily
}: FamilyWalletProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Form states
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberBalance, setNewMemberBalance] = useState('');
  const [actionAmount, setActionAmount] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const totalFamilyBalance = familyMembers.reduce((sum, m) => sum + m.balance, 0);

  const resetForms = () => {
    setNewMemberName('');
    setNewMemberBalance('');
    setActionAmount('');
    setActionDescription('');
    setTransferToId('');
    setSelectedMember(null);
    setActiveModal(null);
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    onAddMember(newMemberName.trim(), parseFloat(newMemberBalance) || 0);
    resetForms();
  };

  const handleDeposit = () => {
    const amount = parseFloat(actionAmount);
    if (!selectedMember || isNaN(amount) || amount <= 0) return;
    onModifyAmount(selectedMember, amount, 'deposit', actionDescription || 'Amount added');
    resetForms();
  };

  const handleWithdraw = () => {
    const amount = parseFloat(actionAmount);
    if (!selectedMember || isNaN(amount) || amount <= 0) return;
    onModifyAmount(selectedMember, amount, 'withdraw', actionDescription || 'Amount withdrawn');
    resetForms();
  };

  const handleTransfer = () => {
    const amount = parseFloat(actionAmount);
    if (!selectedMember || !transferToId || isNaN(amount) || amount <= 0) return;
    onTransferBetweenFamily(selectedMember, transferToId, amount);
    resetForms();
  };

  const handleToMain = () => {
    const amount = parseFloat(actionAmount);
    if (!selectedMember || isNaN(amount) || amount <= 0) return;
    onTransferFamilyToMain(selectedMember, amount);
    resetForms();
  };

  const handleFromMain = () => {
    const amount = parseFloat(actionAmount);
    if (!selectedMember || isNaN(amount) || amount <= 0) return;
    onTransferMainToFamily(selectedMember, amount);
    resetForms();
  };

  const getSelectedMemberName = () => {
    return familyMembers.find(m => m.id === selectedMember)?.name || 'Member';
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownIcon className="w-3.5 h-3.5 text-emerald-500" />;
      case 'withdraw': return <ArrowUpIcon className="w-3.5 h-3.5 text-rose-500" />;
      case 'transfer_in': return <ArrowDownIcon className="w-3.5 h-3.5 text-sky-500" />;
      case 'transfer_out': return <ArrowUpIcon className="w-3.5 h-3.5 text-amber-500" />;
      default: return <WalletIcon className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-emerald-600';
      case 'withdraw': return 'text-rose-600';
      case 'transfer_in': return 'text-sky-600';
      case 'transfer_out': return 'text-amber-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Family Wallet</h1>
          <p className="text-slate-500 text-sm">Manage family members' funds and transfers</p>
        </div>
        <Button onClick={() => setActiveModal('add')}>
          <UserPlusIcon className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <WalletIcon className="w-4 h-4" /> Main Wallet
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(currentBudget)}</p>
          </div>
        </Card>
        <Card className="border-none shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4">
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <UsersIcon className="w-4 h-4" /> Family Total
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalFamilyBalance)}</p>
          </div>
        </Card>
        <Card className="border-none shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
            <div className="flex items-center gap-2 text-amber-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <UsersIcon className="w-4 h-4" /> Members
            </div>
            <p className="text-2xl font-bold text-white">{familyMembers.length}</p>
          </div>
        </Card>
      </div>

      {/* Family Members Grid */}
      {familyMembers.length === 0 ? (
        <Card className="border-none shadow-md">
          <CardContent className="p-12 text-center">
            <UsersIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Family Members</h3>
            <p className="text-slate-500 mb-4">Add family members to start managing their funds</p>
            <Button onClick={() => setActiveModal('add')}>
              <UserPlusIcon className="w-4 h-4 mr-2" /> Add First Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {familyMembers.map(member => (
            <Card key={member.id} className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {/* Member Header */}
                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{member.name}</h3>
                      <p className="text-xs text-slate-400">{member.transactions.length} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-indigo-700">{formatCurrency(member.balance)}</p>
                    <span className="text-xs text-slate-400">Balance</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3 grid grid-cols-5 gap-2">
                  <button
                    onClick={() => { setSelectedMember(member.id); setActiveModal('deposit'); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                      <ArrowDownIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">Add</span>
                  </button>

                  <button
                    onClick={() => { setSelectedMember(member.id); setActiveModal('withdraw'); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-rose-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center transition-colors">
                      <ArrowUpIcon className="w-4 h-4 text-rose-600" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">Remove</span>
                  </button>

                  <button
                    onClick={() => { setSelectedMember(member.id); setActiveModal('transfer'); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-sky-50 transition-colors group"
                    disabled={familyMembers.length < 2}
                  >
                    <div className="w-8 h-8 rounded-full bg-sky-100 group-hover:bg-sky-200 flex items-center justify-center transition-colors">
                      <ArrowRightLeftIcon className="w-4 h-4 text-sky-600" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">Transfer</span>
                  </button>

                  <button
                    onClick={() => { setSelectedMember(member.id); setActiveModal('toMain'); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-indigo-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                      <SendIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">→ Main</span>
                  </button>

                  <button
                    onClick={() => { setSelectedMember(member.id); setActiveModal('fromMain'); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-amber-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                      <BanknoteIcon className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">← Main</span>
                  </button>
                </div>

                {/* Transaction History Collapsible */}
                <div className="border-t border-slate-100">
                  <button
                    onClick={() => setExpandedHistory(expandedHistory === member.id ? null : member.id)}
                    className="w-full p-3 flex items-center justify-between text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <HistoryIcon className="w-4 h-4" />
                      <span>Transaction History</span>
                    </div>
                    {expandedHistory === member.id
                      ? <ChevronUpIcon className="w-4 h-4" />
                      : <ChevronDownIcon className="w-4 h-4" />
                    }
                  </button>

                  {expandedHistory === member.id && (
                    <div className="max-h-60 overflow-y-auto">
                      {member.transactions.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                          {member.transactions.slice().reverse().map(txn => (
                            <div key={txn.id} className="px-4 py-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {getTransactionIcon(txn.type)}
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-slate-700 truncate">{txn.description}</p>
                                  <p className="text-[10px] text-slate-400">{formatDate(txn.date)}</p>
                                </div>
                              </div>
                              <span className={`text-xs font-bold ${getTransactionColor(txn.type)}`}>
                                {txn.type === 'deposit' || txn.type === 'transfer_in' ? '+' : '-'}
                                {formatCurrency(txn.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="p-4 text-xs text-slate-400 text-center">No transactions yet</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Remove Member */}
                <div className="border-t border-slate-100 p-2">
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${member.name} from family wallet?`)) {
                        onRemoveMember(member.id);
                      }
                    }}
                    className="w-full text-xs text-rose-400 hover:text-rose-600 hover:bg-rose-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2Icon className="w-3 h-3" /> Remove Member
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Add Member Modal */}
      <Modal
        isOpen={activeModal === 'add'}
        onClose={resetForms}
        title="Add Family Member"
      >
        <div className="space-y-4">
          <Input
            label="Member Name"
            placeholder="e.g., Mom, Dad, Sister"
            value={newMemberName}
            onChange={e => setNewMemberName(e.target.value)}
            autoFocus
          />
          <Input
            label="Initial Balance (₹)"
            type="number"
            placeholder="0"
            min="0"
            value={newMemberBalance}
            onChange={e => setNewMemberBalance(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={resetForms}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={!newMemberName.trim()}>
              <UserPlusIcon className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        isOpen={activeModal === 'deposit'}
        onClose={resetForms}
        title={`Add Amount to ${getSelectedMemberName()}`}
      >
        <div className="space-y-4">
          <Input
            label="Amount (₹)"
            type="number"
            placeholder="e.g., 5000"
            min="0"
            value={actionAmount}
            onChange={e => setActionAmount(e.target.value)}
            autoFocus
          />
          <Input
            label="Description (Optional)"
            placeholder="e.g., Monthly allowance"
            value={actionDescription}
            onChange={e => setActionDescription(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={resetForms}>Cancel</Button>
            <Button onClick={handleDeposit} className="bg-emerald-600 hover:bg-emerald-700">
              <ArrowDownIcon className="w-4 h-4 mr-2" /> Add Amount
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={activeModal === 'withdraw'}
        onClose={resetForms}
        title={`Remove Amount from ${getSelectedMemberName()}`}
      >
        <div className="space-y-4">
          <Input
            label="Amount (₹)"
            type="number"
            placeholder="e.g., 2000"
            min="0"
            value={actionAmount}
            onChange={e => setActionAmount(e.target.value)}
            autoFocus
          />
          <Input
            label="Description (Optional)"
            placeholder="e.g., Expense"
            value={actionDescription}
            onChange={e => setActionDescription(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={resetForms}>Cancel</Button>
            <Button variant="danger" onClick={handleWithdraw}>
              <ArrowUpIcon className="w-4 h-4 mr-2" /> Remove Amount
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Between Family Modal */}
      <Modal
        isOpen={activeModal === 'transfer'}
        onClose={resetForms}
        title={`Transfer from ${getSelectedMemberName()}`}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Transfer To</label>
            <select
              className="block w-full rounded-lg border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={transferToId}
              onChange={e => setTransferToId(e.target.value)}
            >
              <option value="">Select member</option>
              {familyMembers
                .filter(m => m.id !== selectedMember)
                .map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({formatCurrency(m.balance)})</option>
                ))
              }
            </select>
          </div>
          <Input
            label="Amount (₹)"
            type="number"
            placeholder="e.g., 1000"
            min="0"
            value={actionAmount}
            onChange={e => setActionAmount(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={resetForms}>Cancel</Button>
            <Button onClick={handleTransfer} disabled={!transferToId} className="bg-sky-600 hover:bg-sky-700">
              <ArrowRightLeftIcon className="w-4 h-4 mr-2" /> Transfer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Family → Main Modal */}
      <Modal
        isOpen={activeModal === 'toMain'}
        onClose={resetForms}
        title={`Transfer ${getSelectedMemberName()} → Main Wallet`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-sm text-indigo-700">
            This will add the amount to your current month's budget.
          </div>
          <Input
            label="Amount (₹)"
            type="number"
            placeholder="e.g., 3000"
            min="0"
            value={actionAmount}
            onChange={e => setActionAmount(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={resetForms}>Cancel</Button>
            <Button onClick={handleToMain}>
              <SendIcon className="w-4 h-4 mr-2" /> Transfer to Main
            </Button>
          </div>
        </div>
      </Modal>

      {/* Main → Family Modal */}
      <Modal
        isOpen={activeModal === 'fromMain'}
        onClose={resetForms}
        title={`Transfer Main Wallet → ${getSelectedMemberName()}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
            This will deduct from your current month's budget.
          </div>
          <Input
            label="Amount (₹)"
            type="number"
            placeholder="e.g., 2000"
            min="0"
            value={actionAmount}
            onChange={e => setActionAmount(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={resetForms}>Cancel</Button>
            <Button onClick={handleFromMain} className="bg-amber-600 hover:bg-amber-700">
              <BanknoteIcon className="w-4 h-4 mr-2" /> Transfer from Main
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
