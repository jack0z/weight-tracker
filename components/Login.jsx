import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { LogIn, Lock, User, Moon, Sun } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function Login({ onLogin, theme, toggleTheme }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registering, setRegistering] = useState(false);

  const colors = {
    bg: theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#F3EAD3]',
    cardBg: theme === 'dark' ? 'bg-[#313338]' : 'bg-[#EAE4CA]',
    border: theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]',
    text: theme === 'dark' ? 'text-[#e3e5e8]' : 'text-[#5C6A72]',
    textMuted: theme === 'dark' ? 'text-[#b5bac1]' : 'text-[#829181]',
    buttonBgPrimary: theme === 'dark' ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-[#8DA101] hover:bg-[#798901]',
    buttonBgSecondary: theme === 'dark' ? 'bg-[#4f545c] hover:bg-[#5d6269]' : 'bg-[#939F91] hover:bg-[#8A948C]',
    inputBg: theme === 'dark' ? 'bg-[#1e1f22]' : 'bg-[#E5DFC5]',
    iconBg: theme === 'dark' ? 'bg-[#404249]' : 'bg-[#B9C0AB]',
    iconColor: theme === 'dark' ? 'text-[#5865f2]' : 'text-[#8DA101]',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit called", { username, password, registering });

    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }

    try {
      const endpoint = registering
        ? '/.netlify/functions/register'
        : '/.netlify/functions/login';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(registering ? 'Account created!' : `Welcome back, ${username}!`);
        sessionStorage.setItem("current-user", username);
        onLogin({ username });
      } else {
        toast.error(data.message || "Authentication failed");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    }
  };

  return (
    <div className={`min-h-screen ${colors.bg} flex items-center justify-center p-4`}>
      <Toaster 
        position="top-right" 
        theme={theme}
        toastOptions={{
          style: {
            background: theme === 'dark' ? "#313338" : "#ffffff",
            color: theme === 'dark' ? "#e3e5e8" : "#374151",
            border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
          }
        }}
      />
      <Card className={`w-full max-w-md ${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
        <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex flex-col items-center`}>
          <div className={`w-16 h-16 rounded-full ${colors.iconBg} flex items-center justify-center mb-2`}>
            <User className={`h-8 w-8 ${colors.iconColor}`} />
          </div>
          <CardTitle className={`${colors.text} text-xl`}>
            {registering ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <p className={`text-sm ${colors.textMuted} mt-1`}>
            {registering ? 'Register a new account' : 'Log in to access your weight tracker'}
          </p>
        </CardHeader>
        <CardContent className="py-6 px-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className={`block text-sm font-medium ${colors.textMuted} mb-2`}>Username</label>
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  type="text"
                  placeholder="Enter your username"
                  className={`${colors.inputBg} border-0 h-10 pl-3 w-full ${colors.text} rounded-md`}
                />
              </div>
              <div className="flex flex-col">
                <label className={`block text-sm font-medium ${colors.textMuted} mb-2`}>Password</label>
                <Input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type="password"
                  placeholder="Enter your password"
                  className={`${colors.inputBg} border-0 h-10 pl-3 w-full ${colors.text} rounded-md`}
                />
              </div>
              <button
                type="submit"
                className={`w-full mt-2 py-2 ${colors.buttonBgPrimary} text-white rounded-md flex items-center justify-center`}
              >
                {registering ? (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegistering(!registering);
                  setPassword("");
                }}
                className={`w-full mt-2 py-2 ${colors.buttonBgSecondary} text-white rounded-md`}
              >
                {registering ? 'Back to Login' : 'Create New Account'}
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`p-2 rounded-full ${theme === 'dark' ? colors.buttonBgSecondary : 'bg-[#8DA101] hover:bg-[#798901]'}`}
                  title="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-white" />
                  ) : (
                    <Moon className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}