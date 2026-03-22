
import { Outlet } from 'react-router-dom';
import Background from './Background';

export default function AuthLayout() {
  return (
    <>
      <Background />
      <div className="app-container">
        <Outlet />
      </div>
    </>
  );
}
