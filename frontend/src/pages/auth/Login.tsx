import { useState } from 'react';
import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import { api } from '../../utils/axiosConfig';
import { Link, useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError('');
      setIsLoading(true);
      
      const response = await api.post('/auth/login', data);
      
      dispatch(setCredentials({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        userId: response.data.userId,
        email: response.data.email,
        fullName: response.data.fullName,
        role: response.data.role
      }));
      
      navigate('/dashboard');
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-primary-950 to-slate-900 relative overflow-hidden font-sans">
      {/* Clean, Smooth Gradient Background */}

      <div className="w-full max-w-md p-10 bg-white/5 backdrop-blur-xl rounded-none shadow-2xl border border-white/10 z-10 mx-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-lg shadow-primary-500/30">
            <span className="text-3xl font-black text-white italic">E</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">EduNova</h1>
          <p className="text-slate-400 mt-3 font-medium">Welcome back! Please login to continue.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-200 text-sm rounded-none border border-red-500/20 backdrop-blur-sm animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                {...register('email')}
                className={`w-full px-5 py-4 bg-white/5 border rounded-none focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-white placeholder:text-slate-600 ${errors.email ? 'border-red-500/50' : 'border-white/10 hover:border-white/20'}`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`w-full px-5 py-4 bg-white/5 border rounded-none focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-white placeholder:text-slate-600 ${errors.password ? 'border-red-500/50' : 'border-white/10 hover:border-white/20'}`}
                placeholder="••••••••"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <IconButton 
                  size="small" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </div>
            </div>
            {errors.password && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary-600 text-white font-bold rounded-none hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-none animate-spin"></div>
                <span>Signing in...</span>
              </div>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <p className="text-sm text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-500 font-bold hover:text-primary-400 transition-colors uppercase tracking-tight ml-1">
              Register Now
            </Link>
          </p>
          <Link to="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            Return to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
