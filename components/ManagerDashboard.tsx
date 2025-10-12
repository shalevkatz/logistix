// components/ManagerDashboard.tsx
import HomeScreen from '../app/HomeScreen';

/**
 * ManagerDashboard - Wraps the existing HomeScreen for managers
 * This allows role-based routing while keeping your existing manager interface
 */
export default function ManagerDashboard() {
  return <HomeScreen />;
}