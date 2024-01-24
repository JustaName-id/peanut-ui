import { useEffect, useMemo, useState } from 'react'
import { useAtom } from 'jotai'

import * as _consts from '../claim.consts'
import * as store from '@/store/'
import * as global_components from '@/components/global'
import * as hooks from '@/hooks'
import * as utils from '@/utils'
import * as interfaces from '@/interfaces'
import dropdown_svg from '@/assets/dropdown.svg'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'

export function ClaimSuccessView({ txHash, claimDetails, senderAddress }: _consts.IClaimScreenProps) {
    const { address } = useAccount()
    const router = useRouter()
    const gaEventTracker = hooks.useAnalyticsEventTracker('claim-component')

    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [chainDetails] = useAtom(store.defaultChainDetailsAtom)

    console.log({ chainDetails })
    console.log({ claimDetails })

    const explorerUrlWithTx = useMemo(
        () =>
            chainDetails.find((detail) => detail.chainId === claimDetails[0].chainId)?.explorers[0].url +
            '/tx/' +
            txHash[0],
        [txHash, chainDetails]
    )

    console.log({ explorerUrlWithTx })

    useEffect(() => {
        router.prefetch('/send')
        gaEventTracker('peanut-claimed', 'success')
        sendNotification()
    }, [])

    const sendNotification = async () => {
        const chainName = chainDetails.find(
            (detail) => detail.chainId === claimDetails[0].chainId
        )?.name
        utils.sendNotification(senderAddress, address, chainName)
    }

    return (
        <>
            <h2 className="title-font mb-0 text-3xl font-black md:text-5xl">Congratulations!</h2>
            <p className="mb-0 mt-3 break-words text-center text-lg">You have successfully claimed your funds.</p>
            <div
                className="mt-2 flex cursor-pointer items-center justify-center"
                onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen)
                }}
            >
                <div className="cursor-pointer border-none bg-white text-sm  ">Check Transaction </div>
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
                <div className="m-2 flex flex-col items-center justify-center gap-2 text-center text-base sm:p-0">
                    <a
                        href={explorerUrlWithTx ?? ''}
                        target="_blank"
                        className="cursor-pointer break-all text-center text-sm font-bold text-black underline "
                    >
                        {txHash[0]}
                    </a>
                    <p className="m-0">
                        <small>
                            Click the confirmation above and check <b>Internal Txs</b>. It might be slow.
                        </small>
                    </p>
                    <p className="m-0">
                        <small>If you don't see the funds in your wallet, make sure you are on the right chain.</small>
                    </p>
                </div>
            )}

            <p className="mt-4 text-center text-xs">
                Thoughts? Feedback? Use cases? Memes? Hit us up on{' '}
                <a href="https://discord.gg/BX9Ak7AW28" target="_blank" className="cursor-pointer text-black underline">
                    Discord
                </a>
                !
            </p>

            <global_components.PeanutMan type="presenting" />
        </>
    )
}
