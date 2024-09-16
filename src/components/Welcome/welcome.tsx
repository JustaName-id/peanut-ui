'use client'
import '@/styles/globals.css'
import { useEffect, useState } from 'react'
// import { getCalApi } from '@calcom/embed-react'
// import Lottie from 'react-lottie'
import Link from 'next/link'

import {
    WALLETCONNECT_LOGO,
    CLAVE_LOGO,
    ECO_LOGO,
    MANTLE_ICON,
    BLOCKSCOUT_LOGO,
    HYPERSPHERE_LOGO_SQUARE,
    ZEEPRIME_LOGO_SQUARE,
    LONGHASH_LOGO_SQUARE,
    NAZARE_LOGO_SQUARE,
    DEREK_PERSON,
    SHARUK_PERSON,
    KOFIME_PERSON,
    SBF_PERSON,
    SmileStars,
    PEANUTMAN_HAPPY,
} from '@/assets'
import * as chain_logos from '@/assets/chains'
import { MarqueeWrapper, MarqueeComp } from '../Global/MarqueeWrapper'
import { FAQsPanel } from '../Global/FAQs'
import { Testimonials } from '../Global/Testimonials'
// import { Disclosure } from '@headlessui/react'

const logoCloudLogos = [
    { icon: WALLETCONNECT_LOGO, link: 'https://walletconnect.com/' },
    { icon: CLAVE_LOGO, link: 'https://www.getclave.io/', classNameImg: 'rounded-full' },
    { icon: ECO_LOGO, link: 'https://eco.org/?ref=com' },
    { icon: MANTLE_ICON, link: 'https://www.mantle.xyz/' },
    {
        icon: BLOCKSCOUT_LOGO,
        link: 'https://www.blockscout.com/',
        className: 'bg-black',
        classNameImg: 'rounded-full',
    },
    {
        icon: HYPERSPHERE_LOGO_SQUARE,
        link: 'https://www.hypersphere.ventures/',
        classNameImg: 'rounded-full',
    },
    {
        icon: ZEEPRIME_LOGO_SQUARE,
        link: 'https://zeeprime.capital/',
        className: ' bg-white rounded-full ',
        classNameImg: 'h-6 w-6 sm:h-12 sm:w-12 -mt-[4px]',
    },
    {
        icon: LONGHASH_LOGO_SQUARE,
        link: 'https://www.longhash.vc/',
        className: 'p-0 bg-white',
        classNameImg: 'h-6 w-6 sm:h-12 sm:w-12 rounded-lg',
    },
    {
        icon: NAZARE_LOGO_SQUARE,
        link: 'https://www.nazare.io/',
        classNameImg: 'rounded-full',
    },
]

const faqs = [
    { question: 'How can I try?', answer: 'Check out our dapp or any of the projects that already integrated Peanut.' },
    {
        question: 'What are the trust assumptions?',
        answer: 'Peanut Protocol is non-custodial, permissionless and decentralised. Read more ',
        redirectUrl: 'https://docs.peanut.to/overview/what-are-links/trust-assumptions',
        redirectText: 'here.',
    },
    {
        question: 'What happens if I want to cancel or if I lose the link?',
        answer: 'The only thing you need is the transaction hash! To see how, click ',
        redirectUrl: 'https://peanut.to/refund',
        redirectText: 'here.',
    },
    {
        question: 'What are the fees?',
        answer: 'On our dapp, we sponsor gasless claiming and sending on L2s. Integrators can choose to sponsor the transactions. We do not have a fee on the protocol for same-chain transactions, see ',
        redirectUrl: 'https://docs.peanut.to/overview/pricing',
        redirectText: 'here.',
    },
    {
        question: 'I need help!',
        answer: 'Sure! Let us know at hello@peanut.to or on ',
        redirectUrl: 'https://discord.gg/uWFQdJHZ6j',
        redirectText: 'discord.',
    },
    {
        question: 'Are you audited?',
        answer: 'Yes! ',
        redirectUrl: 'https://docs.peanut.to/other/security-audit',
        redirectText: 'See our docs for more',
    },
    {
        question: 'I want this for our app! How long does it take to integrate?',
        answer: 'Our record integration took 2 hours, but it depends on your stack. ',
        calModal: true,
        redirectText: 'Lets talk!',
    },
]
const testimonials = [
    {
        imageSrc: DEREK_PERSON.src,
        altText: 'picture of chad',
        comment: 'How did this not exist before?! Great UX!',
        name: 'Derek Rein',
        detail: 'WalletConnect',
        detailRedirectUrl: 'https://walletconnect.com/',
        bgColorClass: 'bg-white',
    },
    {
        imageSrc: SHARUK_PERSON.src,
        altText: 'eco man',
        comment: 'Peanut allows us to elegantly solve the cold start problem!',
        name: 'shahrukh Rao',
        detail: 'Eco',
        detailRedirectUrl: 'https://eco.org/?ref=com',
        bgColorClass: 'bg-white',
    },
    {
        imageSrc: KOFIME_PERSON.src,
        altText: 'kofi',
        comment: 'Very buttery experience!',
        name: 'Kofi.me',
        detail: 'Kofi.me',
        detailRedirectUrl: 'https://www.kofime.xyz/',
        bgColorClass: 'bg-white',
    },
    {
        imageSrc: SBF_PERSON.src, // TODO: replace with actual image@
        altText: 'picture of pixel art SBF',
        comment: 'I have a peanut allergy. Help!',
        name: 'CEx CEO',
        detail: 'Probably FTX',
        bgColorClass: 'bg-white',
    },
]

export function Welcome() {
    // const [openedFaq, setOpenedFaq] = useState<number | null>(null)

    // function classNames(...classes: any) {
    //     return classes.filter(Boolean).join(' ')
    // }

    return (
        <div className="flex w-full flex-col items-center justify-center">
            <div className="flex w-full text-black dark:text-white">
                <div className="flex w-full flex-col items-center justify-center gap-8 py-8 text-center sm:px-6 sm:py-16 md:gap-12 lg:mx-0 lg:px-0">
                    <div className="space-y-8">
                        <div className="flex w-full flex-col items-center justify-center gap-2">
                            <div className="mx-auto flex flex-row items-center justify-center gap-2 font-display text-h1 uppercase md:text-[4rem] lg:text-[5rem]">
                                Send{' '}
                                <div className="scroller w-[6rem] text-h1 md:w-[8.5rem] md:text-[4rem] lg:w-[10rem] lg:text-[5rem]">
                                    <span className="">
                                        NFTs
                                        <br />
                                        USDC
                                        <br />
                                        DAI
                                        <br />
                                        PEPE
                                    </span>
                                </div>{' '}
                                Via Link
                            </div>
                        </div>

                        <div className="max-w-4-xl mx-auto w-3/4 text-h4 uppercase">
                            Send money to your friends without having to worry about anything else!
                        </div>
                    </div>

                    <div className="flex w-full items-center justify-center space-x-4 p-2 sm:gap-4">
                        <Link href={'/send'} className="btn-2xl btn-purple max-w-64">
                            App
                        </Link>

                        <Link
                            href="https://docs.peanut.to"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xl font-bold md:text-2xl"
                        >
                            Integrate →
                        </Link>
                    </div>

                    <div className="mx-5 flex flex-row flex-wrap items-center justify-center gap-4 gap-y-8 sm:gap-8">
                        {logoCloudLogos.map((logo) => {
                            return (
                                <a
                                    href={logo.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    key={logo.icon.src}
                                    className={`spin-on-hover group flex h-8 w-8 items-center justify-center rounded-full border border-n-1 dark:border-white sm:h-16 sm:w-16 ${logo.className}`}
                                >
                                    <img
                                        className={` h-full object-contain ${logo.classNameImg}`}
                                        src={logo.icon.src}
                                        alt="Logo"
                                        loading="eager"
                                    />
                                </a>
                            )
                        })}
                    </div>
                </div>

                {/* <div className="center-xy z-index-1 relative hidden w-1/3 items-center justify-center overflow-hidden border-l-2 border-black py-3 lg:flex lg:pb-16 lg:pt-16 ">
                    <img
                        src={PEANUTMAN_HAPPY.src}
                        className="absolute z-50 duration-200 hover:rotate-12 "
                        alt="Peanutman Cheering"
                    />
                </div> */}
            </div>

            <div className="grid- -cols-1- lg:grid-cols-3- grid- flex w-full flex-wrap items-center gap-4 bg-transparent px-4 py-6">
                <label className="feature feature-primary grow -rotate-2">300k+ Transactions</label>
                <label className="feature grow rotate-1">105k+ Unique wallet addresses</label>
                <label className="feature feature-primary grow -rotate-1">20+ Chains</label>
            </div>

            {/* <div className="py-6"> */}
            {/* <MarqueeWrapper backgroundColor="bg-transparant" direction="right" className="">
                    {Object.entries(chain_logos).map(([chain, logo]) => {
                        return (
                            <div className="pl-3 " key={chain}>
                                <img loading="eager" src={logo.src} className="h-16 w-16" />
                            </div>
                        )
                    })}
                </MarqueeWrapper> */}
            {/* </div> */}

            <div className="flex w-full flex-col items-center justify-center">
                <FAQsPanel heading="FAQs" questions={faqs} />

                {/* <MarqueeComp message={`Frens`} imageSrc={SmileStars.src} imageAnimationClass="animation-faceSpin" /> */}
            </div>

            <div role="list" className="relative z-1 mx-auto pb-20 pt-8 md:pb-36 md:pt-20 lg:px-4 xl:w-[92%] 2xl:w-4/5">
                <Testimonials testimonials={testimonials} />
            </div>
        </div>
    )
}
