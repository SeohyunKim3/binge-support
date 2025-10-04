import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="inquiry-form">
          <header className="inquiry-header">
            <h1>DOLLA</h1>
            <p>MENTAL HEALTH SUPPORT DEPARTMENT</p>
            <h2>INQUIRY FORM</h2>
          </header>
          {children}
          <footer className="inquiry-footer">
            <p>! IMPORTANT NOTICE !</p>
            <p>
              This application is not a substitute for professional care. <br />
              If you feel you might hurt yourself or others, please contact
              emergency services immediately.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}