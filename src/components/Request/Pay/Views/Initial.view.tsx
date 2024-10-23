import * as _consts from '../Pay.consts'
import { useAccount, useSwitchChain } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useContext, useEffect, useState, useMemo } from 'react'
import * as context from '@/context'
import Loading from '@/components/Global/Loading'
import AddressLink from '@/components/Global/AddressLink'
import * as utils from '@/utils'
import Icon from '@/components/Global/Icon'
import MoreInfo from '@/components/Global/MoreInfo'
import * as consts from '@/constants'
import { useCreateLink } from '@/components/Create/useCreateLink'
import { peanut, interfaces } from '@squirrel-labs/peanut-sdk'
import TokenSelector from '@/components/Global/TokenSelector/TokenSelector'
import { switchNetwork as switchNetworkUtil } from '@/utils/general.utils'
import { type ITokenPriceData } from '@/interfaces'
import { Button, Card } from '@/components/0_Bruddle'

const ERR_NO_ROUTE = 'No route found to pay in this chain and token'

enum ViewState {
    INITIAL = 'INITIAL',
    LOADING = 'LOADING',
    READY_TO_PAY = 'READY_TO_PAY',
    ERROR = 'ERROR',
}

async function createXChainUnsignedTx({
    tokenData,
    requestLink,
    senderAddress,
}: {
    tokenData: ITokenPriceData
    requestLink: Awaited<ReturnType<typeof peanut.getRequestLinkDetails>>
    senderAddress: string
}) {
    const xchainUnsignedTxs = await peanut.prepareXchainRequestFulfillmentTransaction({
        fromToken: tokenData.address,
        fromChainId: tokenData.chainId,
        senderAddress,
        squidRouterUrl: 'https://apiplus.squidrouter.com/v2/route',
        provider: await peanut.getDefaultProvider(tokenData.chainId),
        tokenType: utils.isAddressZero(tokenData.address)
            ? interfaces.EPeanutLinkType.native
            : interfaces.EPeanutLinkType.erc20,
        fromTokenDecimals: tokenData.decimals as number,
        linkDetails: requestLink,
    })
    return xchainUnsignedTxs
}

export const InitialView = ({
    onNext,
    requestLinkData,
    estimatedGasCost,
    setTransactionHash,
    tokenPriceData,
    unsignedTx,
    estimatedPoints,
}: _consts.IPayScreenProps) => {
    const { sendTransactions, checkUserHasEnoughBalance } = useCreateLink()
    const { isConnected, address, chain: currentChain } = useAccount()
    const { switchChainAsync } = useSwitchChain()
    const { open } = useWeb3Modal()
    const { setLoadingState, loadingState, isLoading } = useContext(context.loadingStateContext)
    const {
        selectedTokenData,
        selectedChainID,
        setSelectedChainID,
        selectedTokenAddress,
        setSelectedTokenAddress,
        isXChain,
        setIsXChain,
        isFetchingTokenData,
    } = useContext(context.tokenSelectorContext)
    const [errorState, setErrorState] = useState<{
        showError: boolean
        errorMessage: string
    }>({ showError: false, errorMessage: '' })
    const [txFee, setTxFee] = useState<string>('0')
    const [isFeeEstimationError, setIsFeeEstimationError] = useState<boolean>(false)
    const [viewState, setViewState] = useState<ViewState>(ViewState.INITIAL)
    const [estimatedFromValue, setEstimatedFromValue] = useState<string>('0')
    const [tokenRequestedLogoURI, setTokenRequestedLogoURI] = useState<string | undefined>(undefined)
    const [tokenRequestedSymbol, setTokenRequestedSymbol] = useState<string>('')

    const calculatedFee = useMemo(() => {
        return isXChain ? txFee : utils.formatTokenAmount(estimatedGasCost, 3)
    }, [isXChain, estimatedGasCost, txFee])

    const isButtonDisabled = useMemo(() => {
        return (
            viewState === ViewState.LOADING ||
            viewState === ViewState.ERROR ||
            (viewState === ViewState.READY_TO_PAY && !calculatedFee)
        )
    }, [viewState, isLoading, calculatedFee])

    const requestedAmount = useMemo(() => {
        const amount = tokenPriceData
            ? Number(requestLinkData.tokenAmount) * tokenPriceData.price
            : Number(requestLinkData.tokenAmount)

        if (tokenPriceData) {
            return `$ ${utils.formatAmountWithSignificantDigits(amount, 3)}`
        } else {
            return `${utils.formatAmountWithSignificantDigits(amount, 3)} ${tokenRequestedSymbol}`
        }
    }, [tokenPriceData, requestLinkData.tokenAmount, tokenRequestedSymbol])

    const fetchTokenSymbol = async (chainId: string, address: string) => {
        const provider = await peanut.getDefaultProvider(chainId)
        const tokenContract = await peanut.getTokenContractDetails({
            address,
            provider,
        })
        setTokenRequestedSymbol(tokenContract?.symbol ?? '')
    }

    useEffect(() => {
        const estimateTxFee = async () => {
            if (!isXChain) {
                clearError()
                setViewState(ViewState.READY_TO_PAY)
                return
            }
            try {
                clearError()
                setLoadingState('Preparing transaction')
                const txData = await createXChainUnsignedTx({
                    tokenData: selectedTokenData!,
                    requestLink: requestLinkData,
                    senderAddress: address!,
                })
                const { feeEstimation, estimatedFromAmount } = txData
                setEstimatedFromValue(estimatedFromAmount)
                clearError()
                setTxFee(Number(feeEstimation).toFixed(2))
                setViewState(ViewState.READY_TO_PAY)
            } catch (error) {
                setErrorState({ showError: true, errorMessage: ERR_NO_ROUTE })
                setIsFeeEstimationError(true)
                setTxFee('0')
            }
        }

        if (!isConnected || !address) {
            setViewState(ViewState.INITIAL)
            return
        }

        if (isXChain && !selectedTokenData) {
            if (!isFetchingTokenData) {
                setErrorState({ showError: true, errorMessage: ERR_NO_ROUTE })
                setIsFeeEstimationError(true)
                setTxFee('0')
            }
            return
        }

        estimateTxFee()
    }, [isConnected, address, selectedTokenData, requestLinkData, isXChain, isFetchingTokenData])

    useEffect(() => {
        setLoadingState('Loading')
        clearError()
        const isXChain =
            selectedChainID !== requestLinkData.chainId ||
            !utils.areTokenAddressesEqual(selectedTokenAddress, requestLinkData.tokenAddress)
        setIsXChain(isXChain)
    }, [selectedChainID, selectedTokenAddress])

    useEffect(() => {
        const chainDetails = consts.peanutTokenDetails.find((chain) => chain.chainId === requestLinkData.chainId)
        const logoURI =
            chainDetails?.tokens.find((token) =>
                utils.areTokenAddressesEqual(token.address, requestLinkData.tokenAddress)
            )?.logoURI ?? tokenPriceData?.logoURI
        setTokenRequestedLogoURI(logoURI)

        let tokenSymbol =
            requestLinkData.tokenSymbol ??
            consts.peanutTokenDetails
                .find((chain) => chain.chainId === requestLinkData.chainId)
                ?.tokens.find((token) => utils.areTokenAddressesEqual(token.address, requestLinkData.tokenAddress))
                ?.symbol?.toUpperCase() ??
            tokenPriceData?.symbol
        if (tokenSymbol) {
            setTokenRequestedSymbol(tokenSymbol)
        } else {
            fetchTokenSymbol(requestLinkData.chainId, requestLinkData.tokenAddress)
        }
    }, [requestLinkData, tokenPriceData])

    useEffect(() => {
        if (isLoading) {
            setViewState(ViewState.LOADING)
        }
    }, [isLoading])

    useEffect(() => {
        if (viewState !== ViewState.LOADING) {
            setLoadingState('Idle')
        }
    }, [viewState])

    useEffect(() => {
        if (errorState.showError) {
            setViewState(ViewState.ERROR)
        }
    }, [errorState])

    useEffect(() => {
        // Load the token chain pair from the request link data
        resetTokenAndChain()
    }, [])

    const clearError = () => {
        setErrorState({ showError: false, errorMessage: '' })
        setIsFeeEstimationError(false)
    }

    const handleConnectWallet = async () => {
        open().finally(() => {
            if (isConnected) setLoadingState('Loading')
        })
    }

    const switchNetwork = async (chainId: string) => {
        try {
            await switchNetworkUtil({
                chainId,
                currentChainId: String(currentChain?.id),
                setLoadingState,
                switchChainAsync: async ({ chainId }) => {
                    await switchChainAsync({ chainId: chainId as number })
                },
            })
            console.log(`Switched to chain ${chainId}`)
        } catch (error) {
            console.error('Failed to switch network:', error)
        }
    }

    const handleOnNext = async () => {
        const amountUsd = (Number(requestLinkData.tokenAmount) * (tokenPriceData?.price ?? 0)).toFixed(2)
        try {
            clearError()
            if (!unsignedTx) return
            if (!isXChain) {
                await checkUserHasEnoughBalance({ tokenValue: requestLinkData.tokenAmount })
                if (selectedTokenData?.chainId !== String(currentChain?.id)) {
                    await switchNetwork(selectedTokenData!.chainId)
                }
                setLoadingState('Sign in wallet')
                const hash = await sendTransactions({
                    preparedDepositTxs: { unsignedTxs: [unsignedTx] },
                    feeOptions: undefined,
                })

                setLoadingState('Executing transaction')

                await peanut.submitRequestLinkFulfillment({
                    chainId: requestLinkData.chainId,
                    hash: hash ?? '',
                    payerAddress: address ?? '',
                    link: requestLinkData.link,
                    apiUrl: '/api/proxy/patch/',
                    amountUsd,
                })

                const currentDate = new Date().toISOString()
                utils.saveRequestLinkFulfillmentToLocalStorage({
                    details: {
                        ...requestLinkData,
                        destinationChainFulfillmentHash: hash ?? '',
                        createdAt: currentDate,
                    },
                    link: requestLinkData.link,
                })

                setTransactionHash(hash ?? '')
                onNext()
            } else {
                await checkUserHasEnoughBalance({ tokenValue: estimatedFromValue })
                if (selectedTokenData!.chainId !== String(currentChain?.id)) {
                    await switchNetwork(selectedTokenData!.chainId)
                }
                setLoadingState('Sign in wallet')
                const xchainUnsignedTxs = await createXChainUnsignedTx({
                    tokenData: selectedTokenData!,
                    requestLink: requestLinkData,
                    senderAddress: address ?? '',
                })

                const { unsignedTxs } = xchainUnsignedTxs
                const hash = await sendTransactions({
                    preparedDepositTxs: { unsignedTxs },
                    feeOptions: undefined,
                })
                setLoadingState('Executing transaction')
                setTransactionHash(hash ?? '')
                onNext()
            }
        } catch (error) {
            const errorString = utils.ErrorHandler(error)
            setErrorState({
                showError: true,
                errorMessage: errorString,
            })
            console.error('Error while submitting request link fulfillment:', error)
        }
    }

    const resetTokenAndChain = () => {
        setSelectedChainID(requestLinkData.chainId)
        setSelectedTokenAddress(requestLinkData.tokenAddress)
    }

    return (
        <Card shadowSize="6">
            <Card.Header>
                <Card.Title className="text-center">
                    <AddressLink address={requestLinkData.recipientAddress} /> is requesting
                </Card.Title>
            </Card.Header>
            <Card.Content className="col gap-4">
                {(requestLinkData.reference || requestLinkData.attachmentUrl) && (
                    <>
                        <div className={`flex w-full flex-col items-center justify-center  gap-2`}>
                            {requestLinkData.reference && (
                                <label className="max-w-full text-h8">
                                    Ref: <span className="font-normal"> {requestLinkData.reference} </span>
                                </label>
                            )}
                            {requestLinkData.attachmentUrl && (
                                <a
                                    href={requestLinkData.attachmentUrl}
                                    download
                                    target="_blank"
                                    className="flex w-full cursor-pointer flex-row items-center justify-center gap-1 text-h9 font-normal text-gray-1 underline "
                                >
                                    <Icon name={'download'} />
                                    Download attachment
                                </a>
                            )}
                        </div>
                        <div className="flex w-full border-t border-dotted border-black" />
                    </>
                )}

                <div className="flex w-full flex-col items-center justify-center gap-2">
                    <label className="text-h2">{requestedAmount}</label>
                    <div>
                        <div className="flex flex-row items-center justify-center gap-2 pl-1 text-h7">
                            <div className="relative h-6 w-6">
                                <img src={tokenRequestedLogoURI} className="absolute left-0 top-0 h-6 w-6" alt="logo" />
                                <img
                                    src={
                                        consts.supportedPeanutChains.find(
                                            (chain) => chain.chainId === requestLinkData.chainId
                                        )?.icon.url
                                    }
                                    className="absolute -top-1 left-3 h-4 w-4 rounded-full" // Adjust `left-3` to control the overlap
                                    alt="logo"
                                />
                            </div>
                            {utils.formatAmountWithSignificantDigits(Number(requestLinkData.tokenAmount), 3)}{' '}
                            {tokenRequestedSymbol} on{' '}
                            {
                                consts.supportedPeanutChains.find((chain) => chain.chainId === requestLinkData.chainId)
                                    ?.name
                            }
                        </div>
                    </div>
                    <label className="text-h9 font-light">
                        You can fulfill this payment request with any token on any chain. Pick the token and chain that
                        you want to fulfill this request with.
                    </label>
                </div>
                <TokenSelector classNameButton="w-full" onReset={resetTokenAndChain} shouldBeConnected={true} />
                <div className="flex w-full flex-col items-center justify-center gap-2">
                    {!isFeeEstimationError && (
                        <>
                            <div className="flex w-full flex-row items-center justify-between gap-1 px-2 text-h8 text-gray-1">
                                <div className="flex w-max flex-row items-center justify-center gap-1">
                                    <Icon name={'gas'} className="h-4 fill-gray-1" />
                                    <label className="font-bold">Network cost</label>
                                </div>
                                <label className="flex flex-row items-center justify-center gap-1 text-center text-sm font-normal leading-4">
                                    {calculatedFee ? (
                                        `$${calculatedFee}`
                                    ) : (
                                        <div className="h-2 w-16 animate-colorPulse rounded bg-slate-700"></div>
                                    )}
                                    {!isXChain ? (
                                        <MoreInfo
                                            text={
                                                estimatedGasCost && estimatedGasCost > 0
                                                    ? `This transaction will cost you $${utils.formatTokenAmount(estimatedGasCost, 3)} in network fees.`
                                                    : 'This transaction is sponsored by peanut! Enjoy!'
                                            }
                                        />
                                    ) : (
                                        <MoreInfo
                                            text={`This transaction will cost you $${utils.formatTokenAmount(Number(txFee), 3)} in network fees.`}
                                        />
                                    )}
                                </label>
                            </div>
                            <div className="flex w-full flex-row items-center justify-between px-2 text-h8 text-gray-1">
                                <div className="flex w-max flex-row items-center justify-center gap-1">
                                    <Icon name={'plus-circle'} className="h-4 fill-gray-1" />
                                    <label className="font-bold">Points</label>
                                </div>
                                <span className="flex flex-row items-center justify-center gap-1 text-center text-sm font-normal leading-4">
                                    {estimatedPoints ? (
                                        `${estimatedPoints > 0 ? '+' : ''}${estimatedPoints}`
                                    ) : (
                                        <div className="h-2 w-16 animate-colorPulse rounded bg-slate-700"></div>
                                    )}
                                    <MoreInfo
                                        text={
                                            estimatedPoints !== undefined
                                                ? estimatedPoints > 0
                                                    ? `This transaction will add ${estimatedPoints} to your total points balance.`
                                                    : 'This transaction will not add any points to your total points balance'
                                                : 'This transaction will not add any points to your total points balance'
                                        }
                                    />
                                </span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex w-full flex-col items-center justify-center gap-3">
                    <Button
                        disabled={isButtonDisabled}
                        loading={viewState === ViewState.LOADING}
                        onClick={() => {
                            if (!isConnected) handleConnectWallet()
                            else if (ViewState.READY_TO_PAY === viewState) handleOnNext()
                        }}
                    >
                        {(() => {
                            if (!isConnected) {
                                return 'Connect Wallet'
                            }
                            if (viewState === ViewState.LOADING) {
                                return loadingState
                            }
                            return 'Pay'
                        })()}
                    </Button>
                    {errorState.showError && (
                        <div className="text-center">
                            <label className=" text-h8 font-normal text-red ">{errorState.errorMessage}</label>
                        </div>
                    )}
                </div>
            </Card.Content>
        </Card>
    )
}
