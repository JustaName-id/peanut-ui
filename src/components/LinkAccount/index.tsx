'use client'
import { GlobaLinkAccountComponent } from '../Global/LinkAccountComponent'
import { useAuth } from '@/context/authContext'
import * as assets from '@/assets'
import Link from 'next/link'
import { Divider } from '@chakra-ui/react'
import Loading from '../Global/Loading'
import { useContext, useState } from 'react'
import * as context from '@/context'

export const LinkAccountComponent = () => {
    const { user, logoutUser, isFetchingUser } = useAuth()
    const [errorState, setErrorState] = useState<{
        showError: boolean
        errorMessage: string
    }>({ showError: false, errorMessage: '' })
    const { setLoadingState, loadingState, isLoading } = useContext(context.loadingStateContext)
    const handleLogout = async () => {
        try {
            setLoadingState('Logging out')
            await logoutUser()
        } catch (error) {
            console.error('Error logging out', error)
            setErrorState({
                showError: true,
                errorMessage: 'Error logging out',
            })
        } finally {
            setLoadingState('Idle')
        }
    }
    return (
        <div className="card ">
            {!user && isFetchingUser ? (
                <div className="relative flex w-full items-center justify-center">
                    <div className="animate-spin">
                        <img src={assets.PEANUTMAN_LOGO.src} alt="logo" className="h-6 sm:h-10" />
                        <span className="sr-only">Loading...</span>
                    </div>
                </div>
            ) : user && user?.user?.kycStatus !== 'approved' ? (
                <div className="flex flex-col items-center justify-center gap-4">
                    <p className="text-h4">Welcome back, {user?.user?.username ?? user?.user?.email}</p>
                    <p className="text-h8 font-light">Before linking an account, you will have to complete KYC!</p>
                    <Link href={'/profile'} className="btn-purple btn-xl">
                        Complete KYC
                    </Link>
                    <span className="flex w-full flex-row items-center justify-center gap-2">
                        <Divider borderColor={'black'} />
                        <p>Or</p>
                        <Divider borderColor={'black'} />
                    </span>
                    <button className="btn btn-xl " onClick={handleLogout}>
                        {isLoading ? (
                            <div className="flex w-full flex-row items-center justify-center gap-2">
                                <Loading /> {loadingState}
                            </div>
                        ) : (
                            'Logout'
                        )}
                    </button>
                    {errorState.showError && (
                        <div className="text-center">
                            <label className=" text-h8 font-normal text-red ">{errorState.errorMessage}</label>
                        </div>
                    )}
                </div>
            ) : (
                <GlobaLinkAccountComponent />
            )}
        </div>
    )
}
