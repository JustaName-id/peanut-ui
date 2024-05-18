import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethersv5'
import { useAtom } from 'jotai'
import peanut, { claimLinkGasless } from '@squirrel-labs/peanut-sdk'
import { useForm } from 'react-hook-form'
import { Tooltip } from 'react-tooltip'

import * as global_components from '@/components/global'
import * as utils from '@/utils'
import * as _consts from '../claim.consts'
import * as store from '@/store'
import * as consts from '@/consts'
import dropdown_svg from '@/assets/icons/dropdown.svg'
import peanutman_logo from '@/assets/peanut/peanutman-logo.svg'
import axios from 'axios'
import checkbox from '@/assets/icons/checkbox.svg'

export function MultilinkClaimView({ onNextScreen, claimDetails, claimLink, setTxHash }: _consts.IClaimScreenProps) {
    const { isConnected, address } = useAccount()
    const { open } = useWeb3Modal()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [completedTx, setCompletedTx] = useState<
        { chainId: string; tokenAddress: string; txHash: string; explorerUrl: string }[]
    >([])
    const [chainDetails] = useAtom(store.defaultChainDetailsAtom)
    const [ipfsArray, setIpfsArray] = useState<string[]>([])
    const verbose = true

    const [loadingStates, setLoadingStates] = useState<consts.LoadingStates>('idle')
    const isLoading = useMemo(() => loadingStates !== 'idle', [loadingStates])
    const [errorState, setErrorState] = useState<{
        showError: boolean
        errorMessage: string
    }>({ showError: false, errorMessage: '' })
    const [manualErrorState, setManualErrorState] = useState<{
        showError: boolean
        errorMessage: string
    }>({ showError: false, errorMessage: '' })

    const manualForm = useForm<{ address: string; addressExists: boolean }>({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            address: '',
            addressExists: false,
        },
    })

    const claim = async () => {
        if (isLoading) return
        try {
            setErrorState({
                showError: false,
                errorMessage: '',
            })
            if (claimLink && address) {
                setLoadingStates('executing transaction')

                const claimPromises = claimDetails.map((detail) => {
                    if (!detail.claimed) {
                        verbose && console.log(detail)

                        return claimLinkGasless({
                            link: detail.link,
                            recipientAddress: address,
                            baseUrl: `${consts.next_proxy_url}/claim-v2`,
                            APIKey: 'doesnt-matter',
                        }).then((tx) => ({
                            txHash: tx.txHash,
                            details: {
                                token: detail.tokenAddress,
                                chain: detail.chainId,
                            },
                        }))
                    }
                    return Promise.resolve(null)
                })

                const claimTxs = await Promise.all(claimPromises)

                const validClaimTxs = claimTxs.filter((tx) => tx !== null)
                validClaimTxs.forEach((tx) => {
                    if (tx) {
                        console.log(tx.details)
                        console.log('Claim transaction completed:', tx.txHash)
                        console.log(tx.details.chain)
                        const chainDetail = chainDetails.find(
                            (cd) => cd.chainId.toString() === tx.details.chain.toString()
                        )
                        console.log(chainDetail)
                        setCompletedTx((prev) => [
                            ...prev,
                            {
                                chainId: tx.details.chain.toString(),
                                tokenAddress: tx.details.token,
                                txHash: tx.txHash,
                                explorerUrl: chainDetail?.explorers[0].url + '/tx/' + tx.txHash,
                            },
                        ])
                    }
                })

                console.log('awaited all tx')
                console.log(validClaimTxs)

                setTxHash(validClaimTxs.map((tx) => tx?.txHash ?? ''))

                // // onNextScreen()

                setLoadingStates('completed')
            }
        } catch (error) {
            setErrorState({
                showError: true,
                errorMessage: 'Something went wrong while claiming',
            })
            console.error(error)
            setLoadingStates('idle')
        }
    }

    const manualClaim = async (data: { address: string; addressExists: boolean }) => {
        try {
            setManualErrorState({
                showError: false,
                errorMessage: '',
            })

            if (!data.addressExists) {
                setManualErrorState({
                    showError: true,
                    errorMessage: 'Please check the box to confirm that the address exists on the chain',
                })
                return
            }

            if (data.address?.endsWith('.eth')) {
                setLoadingStates('fetching address')

                const resolvedEnsName = await utils.resolveFromEnsName(data.address)
                if (resolvedEnsName) {
                    data.address = resolvedEnsName
                } else {
                    setManualErrorState({
                        showError: true,
                        errorMessage: 'Unknown ens name',
                    })
                    return
                }
            } else if (!ethers.utils.isAddress(data.address)) {
                setManualErrorState({
                    showError: true,
                    errorMessage: 'Please enter a valid address',
                })
                return
            }

            setLoadingStates('executing transaction')
            if (claimLink && data.address) {
                setLoadingStates('executing transaction')
                verbose && console.log('claiming link:' + claimLink)
                const claimTxs = []
                for (const link of claimLink) {
                    verbose && console.log(link)

                    const tx = await claimLinkGasless({
                        link: link,
                        recipientAddress: data.address,
                        baseUrl: `${consts.next_proxy_url}/claim-v2`,
                        APIKey: 'doesnt-matter',
                    })
                    claimTxs.push(tx)
                }

                verbose && console.log('submitted all tx')
                const claimTx = await Promise.all(claimTxs)
                verbose && console.log('awaited all tx')

                verbose && console.log(claimTx)

                setTxHash(claimTx.map((tx) => tx.transactionHash ?? tx.txHash ?? tx.hash ?? tx.tx_hash ?? ''))

                onNextScreen()
            }
        } catch (error) {
            setErrorState({
                showError: true,
                errorMessage: 'Something went wrong while claiming',
            })
            console.error(error)
        } finally {
            setLoadingStates('idle')
        }
    }

    const fetchIpfsFile = async (url: string) => {
        try {
            const ipfsHash = url.split('://')[1]
            const randomProvider = consts.ipfsProviderArray[Math.floor(Math.random() * consts.ipfsProviderArray.length)]
            const response = await axios.get(randomProvider + ipfsHash)
            const formattedResponse = randomProvider + response.data.image.split('://')[1]
            const detail = claimDetails.find((detail) => detail.tokenURI == url)
            const array = new Array<string>(claimDetails.length)
            const index = claimDetails.findIndex((detail) => detail.tokenURI == url)
            array[index] = formattedResponse
            setIpfsArray(array)
            if (detail) {
                detail.metadata = formattedResponse
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        const filteredNftDetails = claimDetails.filter((details) => details.tokenType == 2)
        if (filteredNftDetails.length > 0) {
            filteredNftDetails.map((detail) => {
                fetchIpfsFile(detail.tokenURI)
            })
        }
    }, [claimDetails])

    return (
        <>
            <>
                <h2 className="mb-0 mt-2 py-4 text-center text-3xl font-black lg:text-5xl">
                    You have found a multilink!
                </h2>
                <h3 className="text-md my-1 text-center font-normal sm:text-lg lg:text-xl ">
                    This link contains the following tokens:
                </h3>

                <div className="mb-6 mt-2 flex flex-col gap-2 ">
                    {claimDetails.map((link, idx) => {
                        return (
                            <div className="flex items-center gap-2" key={idx}>
                                <img src={peanutman_logo.src} className="h-5 w-5" />
                                {link.tokenType == 2 ? (
                                    <>
                                        <a
                                            className="text-md my-1 cursor-pointer text-center font-normal text-black underline sm:text-base lg:text-lg "
                                            data-tooltip-id="my-tooltip"
                                            target="_blank"
                                            href={
                                                'https://opensea.io/assets/optimism/0xf6f3956bc653c7acb209d6ff8e965a673938cb7c/' +
                                                link.tokenId
                                            }
                                        >
                                            NFT on{' '}
                                            {chainDetails &&
                                                chainDetails.find((chain) => chain.chainId == link.chainId)?.name}
                                        </a>
                                        <Tooltip
                                            id="my-tooltip"
                                            className="bg-black !opacity-100 "
                                            style={{
                                                backgroundColor: 'black',
                                                borderRadius: '0px',
                                                border: '2px solid black',
                                            }}
                                        >
                                            {ipfsArray.length > 1 ? (
                                                <img src={ipfsArray.at(idx)} loading="eager" className="h-32 w-32" />
                                            ) : (
                                                ''
                                            )}
                                        </Tooltip>
                                    </>
                                ) : (
                                    <label className="text-md my-1 text-center font-normal sm:text-base lg:text-lg">
                                        {link.tokenAmount} {link.tokenSymbol} on{' '}
                                        {chainDetails &&
                                            chainDetails.find((chain) => chain.chainId == link.chainId)?.name}
                                    </label>
                                )}
                                {completedTx.some(
                                    (tx) =>
                                        tx.chainId == link.chainId.toString() && tx.tokenAddress == link.tokenAddress
                                ) && (
                                    <div className="flex items-center gap-2">
                                        -
                                        <a
                                            href={
                                                completedTx.find(
                                                    (tx) =>
                                                        tx.chainId == link.chainId.toString() &&
                                                        tx.tokenAddress == link.tokenAddress
                                                )?.explorerUrl ?? ''
                                            }
                                            target="_blank"
                                            className="cursor-pointer break-all text-center text-sm font-medium text-black underline "
                                        >
                                            {utils.shortenHash(
                                                completedTx.find(
                                                    (tx) =>
                                                        tx.chainId == link.chainId.toString() &&
                                                        tx.tokenAddress == link.tokenAddress
                                                )?.txHash ?? ''
                                            )}{' '}
                                        </a>
                                        <img src={checkbox.src} className="h-4" />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </>

            <button
                type={isConnected ? 'submit' : 'button'}
                className="mx-auto mb-6 block w-full cursor-pointer bg-white p-5 px-2 text-2xl font-black sm:w-2/5 lg:w-1/2"
                id="cta-btn"
                onClick={() => {
                    !isConnected ? open() : claim()
                }}
                disabled={isLoading || loadingStates == 'completed'}
            >
                {loadingStates == 'completed' ? (
                    loadingStates
                ) : isLoading ? (
                    <div className="flex justify-center gap-1">
                        <label>{loadingStates} </label>
                        <span className="bouncing-dots flex">
                            <span className="dot">.</span>
                            <span className="dot">.</span>
                            <span className="dot">.</span>
                        </span>
                    </div>
                ) : isConnected ? (
                    'Claim'
                ) : (
                    'Connect Wallet'
                )}
            </button>
            <div
                className="mt-2 flex cursor-pointer items-center justify-center"
                onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen)
                }}
            >
                <div className="cursor-pointer border-none bg-white text-sm  ">manually enter address</div>
                <img
                    style={{
                        transform: isDropdownOpen ? 'scaleY(-1)' : 'none',
                        transition: 'transform 0.3s ease-in-out',
                    }}
                    src={dropdown_svg.src}
                    alt=""
                    className={'h-6 '}
                />
            </div>
            {isDropdownOpen && (
                <global_components.CardWrapper mb="mb-4">
                    <label className="block text-center text-xs font-medium">
                        If you can't connect, you can also write your address below <br />{' '}
                        <span className="italic">⚠️ WARNING: if you enter a wrong address, funds will get lost!!</span>
                    </label>

                    <form className=" w-full " onSubmit={manualForm.handleSubmit(manualClaim)}>
                        <div className="brutalborder mx-auto mt-4 flex w-11/12 flex-row sm:w-3/4">
                            <input
                                type="text"
                                className="h-4 w-full flex-grow border-none p-4 px-4 placeholder:text-xs placeholder:font-light"
                                placeholder="0x6B37..."
                                {...manualForm.register('address')}
                            />
                            <div className="w-1/8 brutalborder-left tooltip block h-4 cursor-pointer p-2">
                                {isLoading ? (
                                    <div className="flex h-full cursor-pointer items-center border-none bg-white text-base font-bold">
                                        <span className="tooltiptext inline text-black" id="myTooltip">
                                            Claiming...
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        className="flex h-full cursor-pointer items-center border-none bg-white text-base font-bold"
                                        type="submit"
                                    >
                                        <span className="tooltiptext inline text-black" id="myTooltip">
                                            Claim
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                        {manualErrorState.showError && (
                            <div className="text-center">
                                <label className="text-xs font-normal text-red ">{manualErrorState.errorMessage}</label>
                            </div>
                        )}

                        <div className="mx-auto mt-2 flex h-4 flex-row items-center justify-center">
                            <input type="checkbox" className="h-4 w-4" {...manualForm.register('addressExists')} />
                            <label className="ml-2 text-xs font-medium">This address exists on CHAIN</label>
                        </div>
                    </form>
                </global_components.CardWrapper>
            )}
            {errorState.showError && (
                <div className="text-center">
                    <label className="font-bold text-red ">{errorState.errorMessage}</label>
                </div>
            )}

            <global_components.PeanutMan type="presenting" />
        </>
    )
}
