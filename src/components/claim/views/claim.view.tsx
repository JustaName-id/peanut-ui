import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { useAtom } from 'jotai'
import peanut from '@squirrel-labs/peanut-sdk'
import { useForm } from 'react-hook-form'
import { switchNetwork, getWalletClient } from '@wagmi/core'
import { providers } from 'ethers'
import { isMobile } from 'react-device-detect'
import peanutman_logo from '@/assets/peanutman-logo.svg'
import { waitForTransaction } from '@wagmi/core'

import * as global_components from '@/components/global'
import * as _consts from '../claim.consts'
import * as utils from '@/utils'
import * as store from '@/store'
import * as consts from '@/consts'
import * as config from '@/config'
import dropdown_svg from '@/assets/dropdown.svg'
import axios from 'axios'
import { switchChain } from 'viem/actions'

export function ClaimView({
    onNextScreen,
    claimDetails,
    claimLink,
    setTxHash,
    claimType,
    tokenPrice,
}: _consts.IClaimScreenProps) {
    const { isConnected, address, chain: currentChain } = useAccount()
    const { open } = useWeb3Modal()

    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [chainDetails] = useAtom(store.defaultChainDetailsAtom)
    const [IpfsMetadata, setIpfsMetadata] = useState('')
    const verbose = process.env.NODE_ENV === 'development' ? true : false
    const [isIpfsLoading, setIsIpfsLoading] = useState(true)

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

    const getWalletClientAndUpdateSigner = async ({
        chainId,
    }: {
        chainId: string
    }): Promise<providers.JsonRpcSigner> => {
        const walletClient = await getWalletClient({ chainId: Number(chainId) })
        if (!walletClient) {
            throw new Error('Failed to get wallet client')
        }
        const signer = utils.walletClientToSigner(walletClient)
        return signer
    }

    const checkNetwork = async (chainId: string) => {
        //check if the user is on the correct chain
        if (currentChain?.id.toString() !== chainId.toString()) {
            setLoadingStates('allow network switch')

            await utils.waitForPromise(switchChain(config.wagmiConfig, { chainId: Number(chainId) })).catch((error) => {
                setErrorState({
                    showError: true,
                    errorMessage: 'Something went wrong while switching networks',
                })
                setLoadingStates('idle')
                throw error
            })
            setLoadingStates('switching network')
            isMobile && (await new Promise((resolve) => setTimeout(resolve, 4000))) // wait a sec after switching chain before making other deeplink
            setLoadingStates('loading')
        }
    }

    const claim = async () => {
        try {
            if (claimLink && address) {
                setLoadingStates('executing transaction')

                let claimTx
                if (claimDetails[0].chainId == '1') {
                    await checkNetwork(claimDetails[0].chainId)

                    const signer = await getWalletClientAndUpdateSigner({ chainId: claimDetails[0].chainId })

                    claimTx = await peanut.claimLink({
                        recipient: address,
                        link: claimLink[0],
                        structSigner: {
                            signer,
                        },
                    })
                } else {
                    claimTx = await peanut.claimLinkGasless({
                        link: claimLink[0],
                        recipientAddress: address,
                        APIKey: process.env.PEANUT_API_KEY ?? '',
                        baseUrl: `${consts.peanut_api_url}/claim-v2`,
                    })
                }
                verbose && console.log(claimTx)
                setTxHash([claimTx.transactionHash ?? claimTx.txHash ?? claimTx.hash ?? claimTx.tx_hash ?? ''])

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
        const ipfsHash = url.split('://')[1]
        let response = null
        let triedProviders = new Set<string>() // To keep track of providers already tried
        let randomProvider: string | null = null // Declare randomProvider outside the loop

        while (!response && triedProviders.size < consts.ipfsProviderArray.length) {
            const randomIndex = Math.floor(Math.random() * consts.ipfsProviderArray.length)
            randomProvider = consts.ipfsProviderArray[randomIndex]

            if (triedProviders.has(randomProvider)) {
                continue
            }

            triedProviders.add(randomProvider)

            try {
                response = await axios.get(randomProvider + ipfsHash)
                break
            } catch (error) {
                console.error('Error with provider:', randomProvider, '; Error:', error)
            }
        }

        if (response && randomProvider) {
            const formattedResponse = randomProvider + response.data.image.split('://')[1]
            setIpfsMetadata(formattedResponse)

            setTimeout(() => {
                setIsIpfsLoading(false)
            }, 1500)
        } else {
            console.error('All providers tried, none were successful.')
        }
    }

    useEffect(() => {
        if (claimDetails[0].tokenType == '2') {
            fetchIpfsFile(claimDetails[0].tokenURI)
        }
    }, [])

    const manualClaim = async (data: { address: string; addressExists: boolean }) => {
        try {
            setManualErrorState({
                showError: false,
                errorMessage: '',
            })
            if (!ethers.utils.isAddress(data.address)) {
                setManualErrorState({
                    showError: true,
                    errorMessage: 'Please enter a valid address',
                })
                return
            }
            if (!data.addressExists) {
                setManualErrorState({
                    showError: true,
                    errorMessage: 'Please check the box to confirm that the address exists on the chain',
                })
                return
            }
            setLoadingStates('executing transaction')
            if (claimLink && data.address) {
                verbose && console.log('claiming link:' + claimLink)
                const claimTx = await peanut.claimLinkGasless({
                    link: claimLink[0],
                    recipientAddress: data.address,
                    APIKey: process.env.PEANUT_API_KEY ?? '',
                    baseUrl: `${consts.peanut_api_url}/claim-v2`,
                })

                setTxHash([claimTx.transactionHash ?? claimTx.txHash ?? claimTx.hash ?? claimTx.tx_hash ?? ''])

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

    return (
        <>
            {' '}
            {claimType == 'PROMO' && (
                <h2 className="my-2 mb-4 text-center text-base font-black sm:text-xl  ">
                    Oh, you found a promo code! Enjoy your free money!
                </h2>
            )}
            {claimDetails[0].tokenType == '2' ? (
                <div className="flex flex-col items-center justify-center gap-4">
                    <h2 className="my-2 mb-0 text-center text-3xl font-black lg:text-6xl ">
                        Claim NFT on{' '}
                        {chainDetails && chainDetails.find((chain) => chain.chainId == claimDetails[0].chainId)?.name}
                    </h2>
                    <div className="h-64 w-64 p-6  ">
                        {isIpfsLoading ? (
                            <div className="flex h-full w-full animate-spin items-center justify-center">
                                <img src={peanutman_logo.src} alt="logo" className="h-1/2 w-1/2" />
                            </div>
                        ) : (
                            <img src={IpfsMetadata} className="brutalborder brutalshadow h-full w-full" />
                        )}{' '}
                    </div>
                </div>
            ) : (
                <h2 className="my-2 mb-0 text-center text-3xl font-black lg:text-6xl ">
                    Claim{' '}
                    <>
                        {tokenPrice
                            ? '$' + utils.formatAmount(Number(tokenPrice) * Number(claimDetails[0].tokenAmount))
                            : utils.formatTokenAmount(Number(claimDetails[0].tokenAmount))}{' '}
                        {tokenPrice ? 'in ' + claimDetails[0].tokenSymbol : claimDetails[0].tokenSymbol}
                    </>
                </h2>
            )}
            {claimDetails[0].tokenType != '2' ? (
                <h3 className="text-md mb-8 text-center font-black sm:text-lg lg:text-xl ">
                    {chainDetails && chainDetails.find((chain) => chain.chainId == claimDetails[0].chainId)?.name}
                </h3>
            ) : (
                <div className="mb-8 flex flex-col items-center justify-center gap-2">
                    <h3 className="text-md mb-0 text-center font-black sm:text-lg lg:text-xl ">
                        {claimDetails[0].tokenName}
                    </h3>
                    <a
                        className="text-black underline"
                        target="_blank"
                        href={
                            'https://opensea.io/assets/optimism/' +
                            claimDetails[0].tokenAddress +
                            '/' +
                            claimDetails[0].tokenId
                        }
                    >
                        opensea
                    </a>
                </div>
            )}
            <button
                type={isConnected ? 'submit' : 'button'}
                className="mt-2 block w-[90%] cursor-pointer bg-white p-5 px-2  text-2xl font-black sm:w-2/5 lg:w-1/2"
                id="cta-btn"
                onClick={() => {
                    !isConnected ? open() : claim()
                }}
                disabled={isLoading}
            >
                {isLoading ? (
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
                            <div className="w-1/8 brutalborder-left tooltip block h-4 cursor-pointer p-2 ">
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

                        <div className="mx-auto mt-2 flex h-4 flex-row items-center justify-center ">
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
