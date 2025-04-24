import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { LogIn, Lock, User, Moon, Sun } from "lucide-react";
import * as Auth from "../auth.js";

export default function Login({ onLogin, theme, toggleTheme }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registering, setRegistering] = useState(false);

  const handleSubmit = () => {
    const result = Auth.handleLogin(username, password, registering);
    
    if (result.success) {
      // Pass user information back to parent component
      onLogin(result.user);
    } else if (result.shouldRegister && !registering) {
      // Switch to registration mode
      setRegistering(true);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-gray-100'} flex items-center justify-center p-4`}>
      <Card className={`w-full max-w-md ${theme === 'dark' ? 'bg-[#313338] border-[#1e1f22]' : 'bg-white border-gray-200'} shadow-xl rounded-lg overflow-hidden`}>
        <CardHeader className={`border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-gray-200'} pb-3 pt-4 flex flex-col items-center`}>
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
            <User className={`h-8 w-8 ${theme === 'dark' ? 'text-[#5865f2]' : 'text-blue-600'}`} />
          </div>
          <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-xl`}>
            {registering ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <p className={`text-sm ${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-500'} mt-1`}>
            {registering ? 'Register a new account' : 'Log in to access your weight tracker'}
          </p>
        </CardHeader>
        <CardContent className="py-6 px-6">
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-700'} mb-2`}>Username</label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                type="text"
                placeholder="Enter your username"
                className={`${theme === 'dark' ? 'bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8]' : 'bg-gray-50 border-gray-200 text-gray-900'} h-10 pl-3 w-full`}
              />
            </div>
            <div className="flex flex-col">
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-700'} mb-2`}>Password</label>
              <Input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                placeholder="Enter your password"
                className={`${theme === 'dark' ? 'bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8]' : 'bg-gray-50 border-gray-200 text-gray-900'} h-10 pl-3 w-full`}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                }}
              />
            </div>
            <button
              onClick={handleSubmit}
              className={`w-full mt-2 py-2 ${theme === 'dark' ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md flex items-center justify-center`}
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
              onClick={() => {
                setRegistering(!registering);
                setPassword("");
              }}
              className={`w-full mt-2 py-2 ${theme === 'dark' ? 'bg-[#404249] hover:bg-[#4752c4]' : 'bg-gray-200 hover:bg-gray-300'} ${theme === 'dark' ? 'text-white' : 'text-gray-800'} rounded-md`}
            >
              {registering ? 'Back to Login' : 'Create New Account'}
            </button>
            <div className="text-center mt-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${theme === 'dark' ? 'bg-[#404249] hover:bg-[#4752c4]' : 'bg-gray-200 hover:bg-gray-300'}`}
                title="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-white" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 