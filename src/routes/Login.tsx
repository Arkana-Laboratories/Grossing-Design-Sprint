import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('johndoe@cortex.health');
  const [password, setPassword] = useState('demo-password');

  function handleSignIn(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem('cortex.session', 'vf');
    navigate('/');
  }

  return (
    <div className="min-h-full flex">
      <div className="hidden md:flex flex-col justify-center w-[55%] bg-gradient-to-br from-arkana-red-light to-white p-12">
        <h1 className="text-4xl font-semibold text-arkana-black mb-3">Cortex Grossing</h1>
        <p className="text-arkana-gray-500 text-lg max-w-md">
          One source of truth for the grossing bench.
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <form
          onSubmit={handleSignIn}
          className="w-full max-w-md bg-white border border-arkana-gray-200 rounded-2xl p-8 shadow-sm"
        >
          <h2 className="text-2xl font-semibold text-arkana-black mb-6">Sign in</h2>
          <label className="block text-sm font-medium text-arkana-black mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 rounded-xl border border-arkana-gray-200 px-4 mb-4 focus:outline-none focus:ring-2 focus:ring-arkana-red"
          />
          <label className="block text-sm font-medium text-arkana-black mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 rounded-xl border border-arkana-gray-200 px-4 mb-6 focus:outline-none focus:ring-2 focus:ring-arkana-red"
          />
          <Button type="submit" size="lg" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
