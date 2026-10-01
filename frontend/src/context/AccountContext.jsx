import React, { createContext, useState } from 'react';

export const AccountContext = createContext();

export function AccountProvider({ children }) {
  const [selectedAccountId, setSelectedAccountId] = useState('all');

  return (
    <AccountContext.Provider value={{ selectedAccountId, setSelectedAccountId }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = React.useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within AccountProvider');
  }
  return context;
}
