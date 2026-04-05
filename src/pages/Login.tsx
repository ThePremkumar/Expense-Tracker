import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { LogInIcon, MailIcon, LockIcon, WalletIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
      toast.success('Access Granted');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setLoading(true);
      await googleLogin();
      toast.success('Authenticated with Google');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      
      <Card className="w-full max-w-md glass-card-dark border-white/5 shadow-2xl relative z-10 entry-animation">
        <CardHeader className="text-center pt-10">
          <div className="mx-auto w-16 h-16 premium-gradient rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/40 float-animation">
            <WalletIcon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-black text-white tracking-tighter">Command Center</CardTitle>
          <p className="text-slate-500 mt-2 font-bold text-xs uppercase tracking-[0.2em]">Personnel Verification</p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
               <Input
                label="Digital ID (Email)"
                type="email"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@protocol.com"
                icon={<MailIcon className="w-4 h-4 text-slate-500" />}
                required
              />
              <Input
                label="Security Key (Password)"
                type="password"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<LockIcon className="w-4 h-4 text-slate-500" />}
                required
              />
            </div>
            
            <div className="text-right">
              <Link to="/forgot-password" title="Forgot Password" className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                Recover Key
              </Link>
            </div>

            <Button type="submit" className="w-full h-12 premium-gradient font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 group" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                   <LogInIcon className="w-4 h-4" />
                   <span>Authorize Access</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
              <span className="px-4 bg-slate-900 text-slate-600">Secondary Protocols</span>
            </div>
          </div>

          <div className="mt-8">
            <Button
              variant="secondary"
              className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold text-xs uppercase tracking-widest transition-all"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" className="w-4 h-4 mr-3" />
              SSO Verification
            </Button>
          </div>

          <p className="mt-10 text-center text-xs font-bold text-slate-500 tracking-tight">
            New personnel?{' '}
            <Link to="/signup" title="Sign Up" className="text-white hover:text-indigo-400 font-black underline underline-offset-4 decoration-indigo-500 transition-all">
              Request Commissions
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
