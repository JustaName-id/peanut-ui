'use client'
import { createElement, useEffect, useState } from 'react'
import * as global_components from '@/components/global'
import * as _consts from './send.consts'
import { useW3iAccount } from '@web3inbox/widget-react'
import { useAccount } from 'wagmi'
import peanut from '@squirrel-labs/peanut-sdk'

export function Send({ type }: { type: 'normal' | 'raffle' }) {
    const [sendScreen, setSendScreen] = useState<_consts.ISendScreenState>(_consts.INIT_VIEW)
    const [claimLink, setClaimLink] = useState<string | string[]>('')
    const [txHash, setTxHash] = useState<string>('')
    const [chainId, setChainId] = useState<string>('1')
    const [ensName, setEnsName] = useState<string>('')
    const { setAccount } = useW3iAccount()
    const { address } = useAccount({})

    useEffect(() => {
        if (!Boolean(address)) return
        setAccount(`eip155:1:${address}`)
    }, [address, setAccount])

    const handleOnNext = () => {
        const newIdx = sendScreen.idx + 1
        setSendScreen(() => ({
            screen: _consts.SEND_SCREEN_FLOW[newIdx],
            idx: newIdx,
        }))
    }

    const handleOnCustom = (screen: _consts.SendScreens) => {
        setSendScreen(() => ({
            screen: screen,
            idx: _consts.SEND_SCREEN_FLOW.indexOf(screen),
        }))
    }

    async function getEnsName(address: string) {
        const ensName = await peanut.resolveToENSName({
            address: address,
        })
        if (ensName) {
            setEnsName(ensName)
        }
    }

    useEffect(() => {
        if (address) {
            getEnsName(address)
        } else if (!address) {
            setAccount('')
        }
    }, [address])

    return (
        <global_components.PageWrapper bgColor={type === 'raffle' ? ' bg-red' : undefined}>
            {type == 'normal' && (
                <global_components.CardWrapper mt=" mt-16 " shadow>
                    {createElement(_consts.SEND_SCREEN_MAP[sendScreen.screen].comp, {
                        onNextScreen: handleOnNext,
                        onCustomScreen: handleOnCustom,
                        claimLink,
                        setClaimLink,
                        txHash,
                        setTxHash,
                        chainId,
                        setChainId,
                        ensName,
                        setEnsName,
                    } as _consts.ISendScreenProps)}
                </global_components.CardWrapper>
            )}
            {type == 'raffle' && (
                <global_components.CardWrapper mt=" mt-16 " shadow>
                    {createElement(_consts.RAFFLE_SEND_SCREEN_MAP[sendScreen.screen].comp, {
                        onNextScreen: handleOnNext,
                        onCustomScreen: handleOnCustom,
                        claimLink,
                        setClaimLink,
                        txHash,
                        setTxHash,
                        chainId,
                        setChainId,
                        ensName,
                        setEnsName,
                    } as _consts.ISendScreenProps)}
                </global_components.CardWrapper>
            )}
        </global_components.PageWrapper>
    )
}
