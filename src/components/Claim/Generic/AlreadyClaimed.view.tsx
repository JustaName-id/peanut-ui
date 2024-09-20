'use client'

import Icon from '@/components/Global/Icon'
import * as _consts from '../Claim.consts'
import * as consts from '@/constants'
import * as interfaces from '@/interfaces'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export const AlreadyClaimedLinkView = ({ claimLinkData }: { claimLinkData: interfaces.ILinkDetails | undefined }) => {
    const router = useRouter()
    return (
        <div className="flex w-full flex-col items-center justify-center gap-6 py-2 pb-20 text-center">
            <div className="space-y-2">
                <label className="text-h2">Sorry, this link has been claimed already.</label>
                <label className="">
                    This link previously contained {claimLinkData?.tokenSymbol} on{' '}
                    {consts.supportedPeanutChains &&
                        consts.supportedPeanutChains.find((chain) => chain.chainId == claimLinkData?.chainId)?.name}
                </label>
            </div>
            <label className="text-h8 font-normal">
                We would like to hear from your experience. Hit us up on{' '}
                <a className="text-link-decoration" target="_blank" href="https://discord.gg/BX9Ak7AW28">
                    Discord!
                </a>
            </label>
            <Link className="btn-purple btn-xl flex w-full flex-row items-center justify-center gap-1" href={'/send'}>
                <div className="">
                    <Icon name="send" className="" />
                </div>
                Make a payment yourself!
            </Link>
        </div>
    )
}

export default AlreadyClaimedLinkView
