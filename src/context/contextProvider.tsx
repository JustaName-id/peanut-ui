import { ToastProvider } from '@/components/0_Bruddle/Toast'
import { AuthProvider } from './authContext'
import { LoadingStateContextProvider } from './loadingStates.context'
import { TokenContextProvider } from './tokenSelector.context'
import { WalletProvider } from './walletContext'
import { ZeroDevProvider } from './walletContext/zeroDevContext.context'

export const ContextProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <ToastProvider>
            <AuthProvider>
                <ZeroDevProvider>
                    <WalletProvider>
                        <TokenContextProvider>
                            <LoadingStateContextProvider>{children}</LoadingStateContextProvider>
                        </TokenContextProvider>
                    </WalletProvider>
                </ZeroDevProvider>
            </AuthProvider>
        </ToastProvider>
    )
}
