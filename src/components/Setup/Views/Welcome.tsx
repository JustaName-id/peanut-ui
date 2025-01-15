import { Button, Card } from '@/components/0_Bruddle'
import { useToast } from '@/components/0_Bruddle/Toast'
import { useSetupFlow } from '@/hooks/useSetupFlow'
import { useZeroDev } from '@/hooks/useZeroDev'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const WelcomeStep = () => {
    const { handleNext } = useSetupFlow()
    const { handleLogin, isLoggingIn, isKernelClientReady } = useZeroDev()
    const { push } = useRouter()
    const toast = useToast()

    useEffect(() => {
        if (isKernelClientReady) {
            push('/home')
        }
    }, [isKernelClientReady])

    return (
        <Card className="border-0">
            <Card.Content className="space-y-4 p-0">
                <Button shadowSize="4" onClick={() => handleNext()}>
                    Sign up
                </Button>
                <Button
                    loading={isLoggingIn}
                    variant="transparent-dark"
                    onClick={() => {
                        handleLogin().catch((_e) => toast.error('Error logging in'))
                    }}
                >
                    Login
                </Button>
            </Card.Content>
        </Card>
    )
}

export default WelcomeStep
