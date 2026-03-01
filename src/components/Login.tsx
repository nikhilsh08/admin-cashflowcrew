// components/Login.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, ArrowRight, ArrowLeft, LogIn } from 'lucide-react';
import { clearError, loginAdmin } from '@/_authContext/slice';
import type { AppDispatch } from '@/_authContext/slice';
import type { RootState } from '@/_authContext/slice';
import {  useNavigate } from 'react-router-dom';

// Types for form data
interface LoginFormData {
  email: string;
  password: string;
}

// Step 1: Email Input Component
interface EmailStepProps {
  onNext: () => void;
  control: { register: any };
  errors: any;
  watch: (name: string) => any;
}

const EmailStep: React.FC<EmailStepProps> = ({ onNext, control, errors, watch }) => {
  const email = watch('email');

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 transform transition-all duration-300">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
        <p className="text-gray-600">Enter your email to continue</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <input
              {...control.register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="admin@example.com"
            />
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!email || errors.email}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        >
          Continue
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>

      <div className="mt-8 text-center">
        <div className="flex space-x-2 justify-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

// Step 2: Password Input Component
interface PasswordStepProps {
  onBack: () => void;
  onSubmit: (data: LoginFormData) => void;
  control: { register: any };
  errors: any;
  loading: boolean;
  handleSubmit: any;
}

const PasswordStep: React.FC<PasswordStepProps> = ({ 
  onBack, 
  onSubmit, 
  control, 
  errors, 
  loading, 
  handleSubmit 
}) => {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 transform transition-all duration-300">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter Password</h2>
        <p className="text-gray-600">Please enter your password to login</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              {...control.register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              type="password"
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your password"
            />
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Back
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(onSubmit)()}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="mr-2 w-5 h-5" />
                Login
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="flex space-x-2 justify-center">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

// Success Dashboard Component

// Main Login Component
const Login: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const dispatch = useDispatch<AppDispatch>();
  const { loader, error, isAuthenticated } = useSelector((state: RootState) => state.admin);
  
  const { control, handleSubmit, formState: { errors }, watch, trigger } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const handleNextStep = async (): Promise<void> => {
    const isValid = await trigger('email');
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const handleBackStep = (): void => {
    setCurrentStep(1);
    dispatch(clearError());
  };

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    dispatch(loginAdmin(data));
  };

  if (isAuthenticated) {
    navigate('/admin/dashboard');
    
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {currentStep === 1 && (
          <EmailStep
            onNext={handleNextStep}
            control={{ register: control.register }}
            errors={errors}
            watch={watch}
          />
        )}
        
        {currentStep === 2 && (
          <PasswordStep
            onBack={handleBackStep}
            onSubmit={onSubmit}
            control={{ register: control.register }}
            errors={errors}
            loading={loader}
            handleSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default Login;