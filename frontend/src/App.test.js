import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock the contexts
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({ user: null, loading: false })
}));

jest.mock('./context/CartContext', () => ({
  CartProvider: ({ children }) => <div>{children}</div>,
  useCart: () => ({ cart: null })
}));

jest.mock('./context/NotificationContext', () => ({
  NotificationProvider: ({ children }) => <div>{children}</div>,
  useNotifications: () => ({ notifications: [], unreadCount: 0 })
}));

describe('App Component', () => {
  test('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  });

  test('shows login page when not authenticated', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
});