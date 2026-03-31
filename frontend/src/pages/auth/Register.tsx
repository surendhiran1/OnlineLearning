import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../utils/axiosConfig';
import { Link, useNavigate } from 'react-router-dom';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['STUDENT', 'STAFF']),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'STUDENT' }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError('');
      setIsLoading(true);
      
      await api.post('/auth/register', data);
      navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-primary-950 to-slate-900 relative overflow-hidden font-sans">
      <div className="w-full max-w-md p-10 bg-white/5 backdrop-blur-xl rounded-none shadow-2xl border border-white/10 z-10 mx-4 my-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-lg shadow-primary-500/30">
            <span className="text-3xl font-black text-white italic">E</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">EduNova</h1>
          <p className="text-slate-400 mt-3 font-medium">Create your account to join the learning revolution.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-200 text-sm rounded-none border border-red-500/20 backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
            <input
              type="text"
              {...register('fullName')}
              className={`w-full px-5 py-3.5 bg-white/5 border rounded-none focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-white placeholder:text-slate-600 ${errors.fullName ? 'border-red-500/50' : 'border-white/10 hover:border-white/20'}`}
              placeholder="John Doe"
            />
            {errors.fullName && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-5 py-3.5 bg-white/5 border rounded-none focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-white placeholder:text-slate-600 ${errors.email ? 'border-red-500/50' : 'border-white/10 hover:border-white/20'}`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className={`w-full px-5 py-3.5 bg-white/5 border rounded-none focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-white placeholder:text-slate-600 ${errors.password ? 'border-red-500/50' : 'border-white/10 hover:border-white/20'}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Your Role</label>
            <select
              {...register('role')}
              className="w-full px-5 py-3.5 bg-slate-800 border border-white/10 rounded-none focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-white appearance-none cursor-pointer"
            >
              <option value="STUDENT">Student</option>
              <option value="STAFF">Staff / Instructor</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 bg-primary-600 text-white font-bold rounded-none hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/20 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-sm text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 font-bold hover:text-primary-400 transition-colors uppercase tracking-tight ml-1">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
