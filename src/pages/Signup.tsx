import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { UserPlusIcon, MailIcon, LockIcon, UserIcon, WalletIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error('Check Confirm Password');
    }

    if (password.length < 6) {
      return toast.error('Security Key Too Simple (Min 6)');
    }

    try {
      setLoading(true);
      await signup(email, password, name);
      toast.success('Commission Confirmed');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Verification rejected');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      
      <Card className="w-full max-w-md glass-card-dark border-white/5 shadow-2xl relative z-10 entry-animation">
        <CardHeader className="text-center pt-8 pb-2">
          <div className="mx-auto w-16 h-16 premium-gradient rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/30 float-animation">
            <UserPlusIcon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-black text-white tracking-tighter">New Commission</CardTitle>
          <p className="text-slate-500 mt-2 font-bold text-[10px] uppercase tracking-[0.3em]">Operational Registration</p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Full Personnel Name"
                type="text"
                className="bg-white/5 border-white/10 text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="PRO NAME"
                icon={<UserIcon className="w-4 h-4 text-slate-500" />}
                required
              />
              <Input
                label="Digital ID (Email)"
                type="email"
                className="bg-white/5 border-white/10 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hq@protocol.com"
                icon={<MailIcon className="w-4 h-4 text-slate-500" />}
                required
              />
              <Input
                label="Security Key (6+ Alphanumeric)"
                type="password"
                className="bg-white/5 border-white/10 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<LockIcon className="w-4 h-4 text-slate-500" />}
                required
              />
              <Input
                label="Key Confirmation"
                type="password"
                className="bg-white/5 border-white/10 text-white"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                icon={<ShieldCheckIcon className="w-4 h-4 text-slate-500" />}
                required
              />
            </div>
            
            <Button type="submit" className="w-full h-12 premium-gradient font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 group translate-y-2" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span>Authorizing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                   <ZapIcon className="w-4 h-4" />
                   <span>Commission Seat</span>
                </div>
              )}
            </Button>
          </form>

          <p className="mt-12 text-center text-xs font-bold text-slate-500 tracking-tight">
            Existing personnel?{' '}
            <Link to="/login" title="Login" className="text-white hover:text-indigo-400 font-black underline underline-offset-4 decoration-indigo-500 transition-all">
              Initiate Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
