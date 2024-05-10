import { useAccount } from 'wagmi'

import * as interfaces from '@/interfaces'
import { useEffect, useState } from 'react'

export const useBalance = () => {
    const [balances, setBalances] = useState<interfaces.IUserBalance[]>([])
    const { address } = useAccount()

    useEffect(() => {
        if (address) {
            fetchBalances(address).then((balances) => {
                if (balances) setBalances(balances)
            })
        }
    }, [address])

    // Function to map the mobula response to the IUserBalance interface
    function convertToUserBalances(
        data: Array<{
            name: string
            symbol: string
            chainId: string
            value: number
            price: number
            quantity: { decimals: string; numeric: string }
            iconUrl: string
            address?: string
        }>
    ): interfaces.IUserBalance[] {
        return data.map((item) => ({
            chainId: item?.chainId ? item.chainId.split(':')[1] : '1',
            address: item?.address ? item.address.split(':')[2] : '0x0000000000000000000000000000000000000000',
            name: item.name,
            symbol: item.symbol,
            decimals: parseInt(item.quantity.decimals),
            price: item.price,
            amount: parseFloat(item.quantity.numeric),
            currency: 'usd',
            logoURI: item.iconUrl,
        }))
    }

    const fetchBalances = async (address: string) => {
        try {
            let attempts = 0
            const maxAttempts = 3
            let success = false
            let userBalances

            while (!success && attempts < maxAttempts) {
                try {
                    const apiResponse = await fetch('/api/walletconnect/fetch-wallet-balance', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            address,
                        }),
                    })

                    if (apiResponse.ok) {
                        const apiResponseJson = await apiResponse.json()

                        userBalances = convertToUserBalances(
                            apiResponseJson.balances.filter((balance: any) => balance.value > 0.009)
                        ).sort((a, b) => {
                            if (a.chainId === b.chainId) {
                                if (a.address.toLowerCase() === '0x0000000000000000000000000000000000000000') return -1
                                if (b.address.toLowerCase() === '0x0000000000000000000000000000000000000000') return 1

                                return b.amount - a.amount
                            } else {
                                return Number(a.chainId) - Number(b.chainId)
                            }
                        })

                        success = true
                    } else {
                        throw new Error('API request failed')
                    }
                } catch (error) {
                    console.log('Error fetching userBalances: ', error)
                    attempts += 1
                    if (attempts >= maxAttempts) {
                        console.log('Max retry attempts reached for fetching balances using walletconnect. Giving up.')
                    }
                }
            }

            return userBalances
        } catch (error) {
            console.error('Unexpected error loading userBalances: ', error)
        }
    }

    return { balances, fetchBalances }
}