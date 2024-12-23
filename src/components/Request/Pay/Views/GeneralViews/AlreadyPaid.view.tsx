'use client'

import Icon from '@/components/Global/Icon'
import * as consts from '@/constants'
import * as _consts from '../../Pay.consts'
import * as utils from '@/utils'
import Link from 'next/link'
import { ReferenceAndAttachment } from '@/components/Request/Components/ReferenceAndAttachment'
import { PaymentsFooter } from '@/components/Global/PaymentsFooter'
import AddressLink from '@/components/Global/AddressLink'

export const AlreadyPaidLinkView = ({ requestLinkData }: { requestLinkData: _consts.IRequestLinkData | undefined }) => {
    const chainName =
        consts.supportedPeanutChains &&
        consts.supportedPeanutChains.find((chain) => chain.chainId == requestLinkData?.chainId)?.name
    const tokenSymbolAvailable: boolean = !!requestLinkData?.tokenSymbol
    const tokenAmountAvailable: boolean = !!requestLinkData?.tokenAmount
    const chainAvailable: boolean = !!requestLinkData?.chainId
    const recipientAddressAvailable: boolean = !!requestLinkData?.recipientAddress
    const dataAvailable: boolean =
        tokenSymbolAvailable || tokenAmountAvailable || chainAvailable || recipientAddressAvailable

    return (
        <div className="flex w-full flex-col items-center justify-center gap-6 py-2 pb-20 text-center">
            <ReferenceAndAttachment
                reference={requestLinkData?.reference}
                attachmentUrl={requestLinkData?.attachmentUrl}
            />
            <label className="text-h2">Payment Receipt</label>
            {dataAvailable && (
                <div className="flex w-full flex-col items-center justify-center gap-2">
                    <label className="text-h8 ">This link previously contained:</label>
                    {tokenSymbolAvailable && (
                        <div className="flex w-full flex-row items-center justify-between gap-1 px-2 text-h8 text-gray-1">
                            <div className="flex w-max  flex-row items-center justify-center gap-1">
                                <label className="font-bold">Token</label>
                            </div>
                            <span className="flex flex-row items-center justify-center gap-1 text-center text-sm font-normal leading-4">
                                {requestLinkData?.tokenSymbol}
                            </span>
                        </div>
                    )}
                    {tokenAmountAvailable && (
                        <div className="flex w-full flex-row items-center justify-between gap-1 px-2 text-h8 text-gray-1">
                            <div className="flex w-max  flex-row items-center justify-center gap-1">
                                <label className="font-bold">Amount</label>
                            </div>
                            <span className="flex flex-row items-center justify-center gap-1 text-center text-sm font-normal leading-4">
                                {requestLinkData?.tokenAmount}
                            </span>
                        </div>
                    )}
                    {chainAvailable && (
                        <div className="flex w-full flex-row items-center justify-between gap-1 px-2 text-h8 text-gray-1">
                            <div className="flex w-max  flex-row items-center justify-center gap-1">
                                <label className="font-bold">Chain</label>
                            </div>
                            <span className="flex flex-row items-center justify-center gap-1 text-center text-sm font-normal leading-4">
                                <img
                                    src={
                                        consts.supportedPeanutChains.find(
                                            (detail) => detail.chainId === requestLinkData?.chainId
                                        )?.icon.url
                                    }
                                    className="h-6 w-6"
                                />
                                {chainName}
                            </span>
                        </div>
                    )}
                    {recipientAddressAvailable && (
                        <div className="flex w-full flex-row items-center justify-between gap-1 px-2 text-h8 text-gray-1">
                            <div className="flex w-max  flex-row items-center justify-center gap-1">
                                <label className="font-bold">Requester</label>
                            </div>
                            <span className="flex flex-row items-center justify-center gap-1 text-center text-sm font-normal leading-4">
                                <AddressLink address={requestLinkData?.recipientAddress ?? ''} />
                            </span>
                        </div>
                    )}
                </div>
            )}
            <label className="text-h9 font-normal">
                We would like to hear from your experience. Hit us up on{' '}
                <a
                    className="cursor-pointer text-black underline dark:text-white"
                    target="_blank"
                    href="https://discord.gg/BX9Ak7AW28"
                >
                    Discord!
                </a>
            </label>
            <PaymentsFooter />
        </div>
    )
}
