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
  BanknoteIcon,
  ShieldCheckIcon
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

  const getSelectedMemberName = () => {
    return familyMembers.find(m => m.id === selectedMember)?.name || '';
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    onAddMember(newMemberName.trim(), parseFloat(newMemberBalance) || 0);
    resetForms();
  };

  const handleAction = (type: ModalType) => {
    const amount = parseFloat(actionAmount);
    if (!selectedMember || isNaN(amount) || amount <= 0) return;

    switch(type) {
      case 'deposit': onModifyAmount(selectedMember, amount, 'deposit', actionDescription || 'Added funds'); break;
      case 'withdraw': onModifyAmount(selectedMember, amount, 'withdraw', actionDescription || 'Withdrawal'); break;
      case 'toMain': onTransferFamilyToMain(selectedMember, amount); break;
      case 'fromMain': onTransferMainToFamily(selectedMember, amount); break;
    }
    resetForms();
  };

  const handleTransfer = () => {
    const amount = parseFloat(actionAmount);
    if (!selectedMember || !transferToId || isNaN(amount) || amount <= 0) return;
    onTransferBetweenFamily(selectedMember, transferToId, amount);
    resetForms();
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-2 py-0.5 rounded-md">Shared Liquidity</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Family Wallet</h1>
          <p className="text-slate-400 font-bold text-sm tracking-tight">Cross-member capital management</p>
        </div>
        <Button onClick={() => setActiveModal('add')} className="premium-gradient font-black text-xs uppercase tracking-widest px-8 h-12 shadow-xl shadow-indigo-500/20">
          <UserPlusIcon className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card stat-card-glow p-6 bg-slate-900 text-white border-none shadow-2xl overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Liquidity</p>
              <h3 className="text-3xl font-black tracking-tighter group-hover:text-indigo-400 transition-colors">{formatCurrency(currentBudget)}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <WalletIcon className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
        </Card>
        <Card className="glass-card stat-card-glow p-6 bg-white border-none shadow-xl overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shared Total</p>
              <h3 className="text-3xl font-black tracking-tighter group-hover:text-emerald-500 transition-colors">{formatCurrency(totalFamilyBalance)}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500">
              <UsersIcon className="w-5 h-5" />
            </div>
          </div>
        </Card>
        <Card className="glass-card stat-card-glow p-6 bg-white border-none shadow-xl overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Seats</p>
              <h3 className="text-3xl font-black tracking-tighter group-hover:text-amber-500 transition-colors">{familyMembers.length}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-500">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Members Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Allocated Accounts</h2>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        {familyMembers.length === 0 ? (
          <Card className="glass-card p-16 text-center border-none shadow-xl">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
              <UsersIcon className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">No Active Members</h3>
            <p className="text-slate-400 font-bold text-sm mb-8 tracking-tight italic">Initialize your family wallet to start shared management.</p>
            <Button onClick={() => setActiveModal('add')} className="premium-gradient">Initialize Seats</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {familyMembers.map(member => (
              <Card key={member.id} className="glass-card border-none shadow-2xl overflow-hidden group hover:scale-[1.01] transition-all duration-500">
                <CardContent className="p-8 space-y-8">
                  {/* Member Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[2rem] premium-gradient flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-500">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{member.name}</h3>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{member.transactions.length} OPS RECORDED</span>
                           <div className="w-1 h-1 rounded-full bg-slate-300" />
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ACTIVE</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-3xl font-black text-indigo-600 tracking-tighter">{formatCurrency(member.balance)}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Liquid Balance</p>
                    </div>
                  </div>

                  {/* High-Octane Action Bar */}
                  <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                    {[
                      { id: 'deposit', icon: ArrowDownIcon, label: 'Add', color: 'hover:bg-emerald-500 hover:text-white', text: 'text-emerald-500' },
                      { id: 'withdraw', icon: ArrowUpIcon, label: 'Out', color: 'hover:bg-rose-500 hover:text-white', text: 'text-rose-500' },
                      { id: 'transfer', icon: ArrowRightLeftIcon, label: 'Flip', color: 'hover:bg-sky-500 hover:text-white', text: 'text-sky-500' },
                      { id: 'toMain', icon: SendIcon, label: 'Main', color: 'hover:bg-indigo-500 hover:text-white', text: 'text-indigo-500' },
                      { id: 'fromMain', icon: BanknoteIcon, label: 'Load', color: 'hover:bg-amber-500 hover:text-white', text: 'text-amber-500' }
                    ].map(style => (
                      <button
                        key={style.id}
                        onClick={() => { setSelectedMember(member.id); setActiveModal(style.id as ModalType); }}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[1.5rem] transition-all duration-300 ${style.color} ${style.text}`}
                      >
                        <style.icon className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{style.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Transaction History */}
                  <div className="space-y-4">
                    <button
                      onClick={() => setExpandedHistory(expandedHistory === member.id ? null : member.id)}
                      className="w-full flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                      <span className="flex items-center gap-2"><HistoryIcon className="w-3.5 h-3.5" /> Ledger Activity</span>
                      {expandedHistory === member.id ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    </button>

                    {expandedHistory === member.id && (
                      <div className="max-h-64 overflow-y-auto pr-2 space-y-2 animate-in slide-in-from-top-4 duration-500">
                        {member.transactions.length > 0 ? (
                          member.transactions.slice().reverse().map(txn => (
                            <div key={txn.id} className="p-4 bg-slate-50/50 rounded-2xl flex items-center justify-between group/txn hover:bg-white hover:shadow-lg transition-all duration-300">
                               <div className="flex items-center gap-4">
                                  <div className={`p-2 rounded-xl ${txn.type.includes('withdraw') || txn.type.includes('out') ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                    {txn.type.includes('withdraw') || txn.type.includes('out') ? <ArrowUpIcon className="w-3.5 h-3.5" /> : <ArrowDownIcon className="w-3.5 h-3.5" />}
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-[11px] font-black text-slate-800 tracking-tight truncate max-w-[150px]">{txn.description}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(txn.date)}</p>
                                  </div>
                               </div>
                               <span className={`text-sm font-black tracking-tighter ${txn.type.includes('withdraw') || txn.type.includes('out') ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {txn.type.includes('withdraw') || txn.type.includes('out') ? '−' : '+'} {formatCurrency(txn.amount)}
                               </span>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No operations recorded</p></div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Encrypted Storage active</span>
                    <button
                      onClick={() => { if (confirm(`Decommission account for ${member.name}?`)) onRemoveMember(member.id); }}
                      className="text-[10px] font-black text-rose-300 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-1.5"
                    >
                      <Trash2Icon className="w-3 h-3" /> Decommission
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* MODALS REDESIGNED */}
      <Modal isOpen={activeModal === 'add'} onClose={resetForms} title="New Allocating Seat">
        <div className="p-2 space-y-6">
          <Input label="CITIZEN NAME" placeholder="OPERATOR NAME" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
          <Input label="INITIAL CAPITAL (₹)" type="number" placeholder="0.00" value={newMemberBalance} onChange={e => setNewMemberBalance(e.target.value)} />
          <Button onClick={handleAddMember} disabled={!newMemberName.trim()} className="w-full h-12 premium-gradient font-black uppercase tracking-widest">Commission Seat</Button>
        </div>
      </Modal>

      {/* Generic Action Modal Redesign */}
      {['deposit', 'withdraw', 'toMain', 'fromMain'].includes(activeModal || '') && (
        <Modal isOpen={!!activeModal} onClose={resetForms} title="Capital Operation">
          <div className="p-2 space-y-6">
            <div className={`p-4 rounded-3xl text-sm font-bold tracking-tight ${activeModal?.includes('Main') ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600'}`}>
                Operational target: <span className="underline decoration-indigo-500 font-black">{getSelectedMemberName() || 'Unknown'}</span>
            </div>
            <Input label="TRANSACTION AMOUNT (₹)" type="number" placeholder="0.00" value={actionAmount} onChange={e => setActionAmount(e.target.value)} autoFocus />
            <Input label="DESCRIPTION" placeholder="NARRATIVE" value={actionDescription} onChange={e => setActionDescription(e.target.value)} />
            <Button onClick={() => handleAction(activeModal)} className={`w-full h-12 font-black uppercase tracking-widest ${activeModal === 'withdraw' ? 'bg-rose-500' : 'bg-slate-900'}`}>Execute Transfer</Button>
          </div>
        </Modal>
      )}

      {/* Transfer Redesign */}
      <Modal isOpen={activeModal === 'transfer'} onClose={resetForms} title="Internal Capital Reallocation">
        <div className="p-2 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Target</label>
            <select className="w-full h-12 px-4 rounded-2xl bg-slate-50 border-none font-black text-slate-900 tracking-tight" value={transferToId} onChange={e => setTransferToId(e.target.value)}>
              <option value="">Select Recipient</option>
              {familyMembers.filter(m => m.id !== selectedMember).map(m => (
                <option key={m.id} value={m.id}>{m.name} ({formatCurrency(m.balance)})</option>
              ))}
            </select>
          </div>
          <Input label="REALLOCATION AMOUNT (₹)" type="number" placeholder="0.00" value={actionAmount} onChange={e => setActionAmount(e.target.value)} />
          <Button onClick={handleTransfer} disabled={!transferToId} className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-black uppercase tracking-widest shadow-xl shadow-sky-500/20">Authorize Reallocation</Button>
        </div>
      </Modal>
    </div>
  );
}
