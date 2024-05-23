'use client'
import * as global_components from '@/components/global'
import * as views from './views'
import * as multilinkViews from './multilinkViews'
import * as _consts from './claim.consts'
import * as interfaces from '@/interfaces'
import { createElement, useEffect, useState } from 'react'
import peanut, { compareVersions } from '@squirrel-labs/peanut-sdk'
import peanutman_logo from '@/assets/peanut/peanutman-logo.svg'
import * as hooks from '@/hooks'
import * as utils from '@/utils'

//Todo: remove these chain and token interfaces and use the ones from the SDK
interface Chain {
    chainId: string
    axelarChainName: string
    chainType: string
}

interface Token {
    chainId: string
    address: string
    name: string
    symbol: string
}

export function Claim() {
    const [linkState, setLinkState] = useState<_consts.linkState>('LOADING')
    const [claimScreen, setClaimScreen] = useState<_consts.IClaimScreenState>(_consts.INIT_VIEW)
    const [claimLink, setClaimLink] = useState<string[]>([])
    const [claimDetails, setClaimDetails] = useState<interfaces.ILinkDetails[]>([])
    const [txHash, setTxHash] = useState<string[]>([])
    const [claimType, setClaimType] = useState<'CLAIM' | 'PROMO'>('CLAIM')
    const [tokenPrice, setTokenPrice] = useState<string | undefined>(undefined)
    const [crossChainDetails, setCrossChainDetails] = useState<Array<Chain & { tokens: Token[] }>>()
    const [crossChainSuccess, setCrossChainSuccess] = useState<_consts.ICrossChainSuccess | undefined>(undefined)
    const [senderAddress, setSenderAddress] = useState<string>('')
    const [recipientAddress, setRecipientAddress] = useState<string>('')

    const gaEventTracker = hooks.useAnalyticsEventTracker('claim-component')
    const verbose = true

    const handleOnNext = () => {
        const newIdx = claimScreen.idx + 1
        setClaimScreen(() => ({
            screen: _consts.CLAIM_SCREEN_FLOW[newIdx],
            idx: newIdx,
        }))
    }

    const handleOnCustom = (screen: _consts.Screens) => {
        setClaimScreen(() => ({
            screen: screen,
            idx: _consts.CLAIM_SCREEN_FLOW.indexOf(screen),
        }))
    }

    const getLinktype = (link: string) => {
        const [, fragment] = link.split('?')
        const urlSearchParams = new URLSearchParams(fragment)
        const i = urlSearchParams.get('i')?.split(',').length

        if (i && i > 1) {
            gaEventTracker('peanut-claim', 'multilink')
            return { type: 'multilink' }
        } else {
            gaEventTracker('peanut-claim', 'normal')
            return { type: 'claim' }
        }
    }

    const isPromoLink = (link: string) => {
        const [, fragment] = link.split('?')
        const urlSearchParams = new URLSearchParams(fragment)

        const linkChainId = urlSearchParams.get('promo')
        const linkVersion = urlSearchParams.get('id')

        if (linkChainId && linkVersion) {
            return true
        } else return false
    }

    const isBridgePossible = async (linkDetails: interfaces.ILinkDetails, tokenPrice: number | undefined) => {
        let tokenPriceSufficient = true

        // DISABLED for now: dencun made prices quite low
        // if (tokenPrice) {
        //     // if token price is available and higher then $5
        //     if (Number(linkDetails.tokenAmount) * tokenPrice < 19.9) {
        //         tokenPriceSufficient = false
        //     } else {
        //         tokenPriceSufficient = true
        //     }
        // } else {
        //     tokenPriceSufficient = true
        // }

        if (linkDetails.tokenType == '2') {
            // if token is not erc20
            return false
        }
        if (linkDetails.chainId == '1'){ 
            // if chain is mainnet
            return false
        }
        const isTestnet = !Object.keys(peanut.CHAIN_DETAILS)
            .map((key) => peanut.CHAIN_DETAILS[key as keyof typeof peanut.CHAIN_DETAILS])
            .find((chain) => chain.chainId == linkDetails.chainId)?.mainnet

        try {
            // TODO: get from API
            const crossChainDetails = await peanut.getXChainOptionsForLink({
                isTestnet,
                sourceChainId: linkDetails.chainId.toString(),
                tokenType: linkDetails.tokenType,
            })

            const contractVersionCheck = compareVersions('v4.2', linkDetails.contractVersion, 'v') // v4.2 is the minimum version required for cross chain
            if (crossChainDetails.length > 0 && contractVersionCheck) {
                // if there are cross chain options
                setCrossChainDetails(crossChainDetails.filter((chain: any) => chain.chainId != '1'))
                if (tokenPriceSufficient) {
                    return true
                } else {
                    return false
                }
            } else {
                return false
            }
        } catch (error) {
            console.log('error fetching cross chain details: ' + error)
            return false
        }
    }

    const checkLink = async (link: string) => {
        try {
            const promoList: {
                [key: string]: string
            } = JSON.parse(process.env.PROMO_LIST ?? '{}')
            var localLink

            if (isPromoLink(link)) {
                const [baseUrl, fragment] = link.split('?')
                localLink = baseUrl + '#?' + promoList[fragment] ?? undefined
            } else {
                localLink = link
            }
            if (localLink === undefined) {
                throw new Error('Promo link not found')
            }

            if (getLinktype(localLink).type === 'multilink') {
                console.log(localLink)
                localLink = localLink.replace('%23', '#')
                verbose && console.log('getting multi link details ' + localLink)

                const links = await peanut.getLinksFromMultilink(localLink)
                const linkDetails: interfaces.ILinkDetails[] = await Promise.all(
                    links.map(async (link: string) => {
                        verbose && console.log(link)
                        return peanut.getLinkDetails({ link: link })
                    })
                )

                verbose && console.log('linkDetails', linkDetails)
                setClaimLink(links)
                setClaimDetails(linkDetails)
                if (linkDetails.every((link) => link.claimed) || linkDetails.every((link) => link.claimed)) {
                    setLinkState('MULTILINK_ALREADY_CLAIMED')
                } else {
                    setLinkState('MULTILINK_CLAIM')
                }
            } else {
                verbose && console.log('getting link details')
                const linkDetails: interfaces.ILinkDetails = await peanut.getLinkDetails({ link: localLink })
                verbose && console.log('linkDetails', linkDetails)
                setClaimLink([localLink.toString()])
                setSenderAddress(linkDetails.senderAddress)

                setClaimDetails([linkDetails])
                if (Number(linkDetails.tokenAmount) <= 0 || linkDetails.claimed) {
                    setLinkState('ALREADY_CLAIMED')
                } else {
                    const _tokenprice = await utils.fetchTokenPrice(linkDetails.tokenAddress, linkDetails.chainId)
                    setTokenPrice(_tokenprice?.price)
                    if (await isBridgePossible(linkDetails, _tokenprice ? Number(_tokenprice.price) : undefined)) {
                        setLinkState('XCHAIN_CLAIM')
                    } else {
                        setLinkState('CLAIM')
                    }
                }
            }
        } catch (error) {
            console.log('Error: ', error)
            setLinkState('NOT_FOUND')
        }
    }

    useEffect(() => {
        const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
        if (pageUrl) {
            checkLink(pageUrl)
        }
    }, [])

    return (
        <global_components.PageWrapper>
            <global_components.CardWrapper>
                {linkState === 'LOADING' && (
                    <div className="animate-spin">
                        <img src={peanutman_logo.src} alt="logo" className="h-6 sm:h-10" />
                        <span className="sr-only">Loading...</span>
                    </div>
                )}
                {linkState === 'NOT_FOUND' && <views.ClaimLinkNotFoundView />}
                {linkState === 'ALREADY_CLAIMED' && <views.ClaimLinkAlreadyClaimedView claimDetails={claimDetails} />}
                {linkState === 'CLAIM' &&
                    createElement(_consts.CLAIM_SCREEN_MAP[claimScreen.screen].comp, {
                        onNextScreen: handleOnNext,
                        onCustomScreen: handleOnCustom,
                        claimLink,
                        setClaimLink,
                        claimDetails,
                        txHash,
                        setTxHash,
                        claimType,
                        setClaimType,
                        tokenPrice,
                        setTokenPrice,
                        senderAddress,
                        setSenderAddress,
                        recipientAddress,
                        setRecipientAddress,
                    } as _consts.IClaimScreenProps)}
                {linkState === 'MULTILINK_CLAIM' &&
                    createElement(_consts.MULTILINK_CLAIM_SCREEN_MAP[claimScreen.screen].comp, {
                        onNextScreen: handleOnNext,
                        onCustomScreen: handleOnCustom,
                        claimLink,
                        setClaimLink,
                        claimDetails,
                        txHash,
                        setTxHash,
                        claimType,
                        setClaimType,
                        tokenPrice,
                        setTokenPrice,
                        senderAddress,
                        setSenderAddress,
                        recipientAddress,
                        setRecipientAddress,
                    } as _consts.IClaimScreenProps)}
                {linkState === 'MULTILINK_ALREADY_CLAIMED' && (
                    <multilinkViews.multilinkAlreadyClaimedView claimDetails={claimDetails} />
                )}
                {linkState === 'XCHAIN_CLAIM' &&
                    createElement(_consts.XCHAIN_CLAIM_SCREEN_MAP[claimScreen.screen].comp, {
                        onNextScreen: handleOnNext,
                        onCustomScreen: handleOnCustom,
                        claimLink,
                        setClaimLink,
                        claimDetails,
                        txHash,
                        setTxHash,
                        claimType,
                        setClaimType,
                        tokenPrice,
                        setTokenPrice,
                        crossChainDetails,
                        crossChainSuccess,
                        setCrossChainSuccess,
                        senderAddress,
                        setSenderAddress,
                        recipientAddress,
                        setRecipientAddress,
                    } as _consts.IClaimScreenProps)}
            </global_components.CardWrapper>{' '}
        </global_components.PageWrapper>
    )
}
