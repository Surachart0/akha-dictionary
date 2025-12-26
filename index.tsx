import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * ไฟล์นี้ทำหน้าที่เป็น Entry Point หลักของแอปพลิเคชัน
 * โดยจะเรนเดอร์คอมโพเนนต์ App.tsx ซึ่งเป็นแอปฉบับสมบูรณ์ (ไม่มีรหัสผ่าน)
 */

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}