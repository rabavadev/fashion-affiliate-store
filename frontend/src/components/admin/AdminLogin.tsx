import React, { useState } from 'react';
import { ArrowLeft, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginAdmin, AdminUser } from '../../services/adminApi';

interface AdminLoginProps {
  onLoginSuccess: (admin: AdminUser) => void;
  onReturnToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onReturnToStore }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AdminPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const admin = await loginAdmin(username, password);
      onLoginSuccess(admin);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid username or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md">
        {/* Return to storefront button */}
        <button
          onClick={onReturnToStore}
          className="inline-flex items-center text-xs uppercase tracking-[0.2em] text-[#767676] hover:text-[#111111] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-2" />
          Return to Boutique
        </button>

        {/* Card */}
        <div className="bg-white border border-[#E5E5E5] p-8 sm:p-10 shadow-sm">
          <div className="text-center mb-8">
            <span className="font-serif text-2xl tracking-[0.25em] text-[#111111] uppercase font-light inline-block">
              MANGO
            </span>
            <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[#767676]">
              CRM & Catalog Administration
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="adminUsernameInput" className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1 font-medium">
                Username
              </label>
              <input
                id="adminUsernameInput"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-sm bg-transparent rounded-none transition-colors"
                placeholder="admin"
              />
            </div>

            <div>
              <label htmlFor="adminPasswordInput" className="block text-[11px] uppercase tracking-widest text-[#767676] mb-1 font-medium">
                Password
              </label>
              <input
                id="adminPasswordInput"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[#CCCCCC] focus:border-[#111111] focus:outline-none text-sm bg-transparent rounded-none transition-colors"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-[#111111] text-[#FAFAFA] text-xs uppercase tracking-[0.2em] font-medium hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              {loading ? 'Authenticating...' : 'Sign In To CRM'}
            </button>
          </form>

          {/* Secure Default Credentials Info */}
          <div className="mt-8 pt-6 border-t border-[#E5E5E5] text-[11px] text-[#767676] space-y-1 bg-[#F9F9F9] p-3">
            <div className="flex items-center gap-1.5 font-medium text-[#111111]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pre-seeded Administrator Credentials:</span>
            </div>
            <div>Username: <code className="bg-white px-1.5 py-0.5 border border-[#DDD] font-mono text-[10px]">admin</code></div>
            <div>Password: <code className="bg-white px-1.5 py-0.5 border border-[#DDD] font-mono text-[10px]">AdminPassword123!</code></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
