import React, { createContext, useContext, ReactNode } from 'react';
import { useInquirySync } from '../hooks/useInquirySync';

// 定义 Context 类型
type InquiryContextType = ReturnType<typeof useInquirySync>;

const InquiryContext = createContext<InquiryContextType | null>(null);

interface InquiryProviderProps {
    projectId: string;
    children: ReactNode;
}

export const InquiryProvider: React.FC<InquiryProviderProps> = ({ projectId, children }) => {
    const syncActions = useInquirySync(projectId);

    return (
        <InquiryContext.Provider value={syncActions}>
            {children}
        </InquiryContext.Provider>
    );
};

export const useInquiryActions = (): InquiryContextType => {
    const context = useContext(InquiryContext);
    if (!context) {
        throw new Error('useInquiryActions must be used within an InquiryProvider');
    }
    return context;
};
