import * as components from '@/components'
import { Metadata, ResolvingMetadata } from 'next'
import { getLinkDetails } from '@squirrel-labs/peanut-sdk'
import * as utils from '@/utils'
export const dynamic = 'force-dynamic'

type Props = {
    params: { id: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

function createURL(searchParams: { [key: string]: string | string[] | undefined }): string {
    const baseURL = 'https://peanut.to/claim'

    const queryParams = new URLSearchParams()

    Object.keys(searchParams).forEach((key) => {
        const value = searchParams[key]
        if (Array.isArray(value)) {
            value.forEach((item) => queryParams.append(key, item))
        } else if (value) {
            queryParams.append(key, value)
        }
    })

    return `${baseURL}?${queryParams.toString()}`
}

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
    let title = 'Peanut Protocol'

    try {
        const url = createURL(searchParams)
        const linkDetails = await getLinkDetails({ link: url })
        title =
            'You received ' +
            (Number(linkDetails.tokenAmount) < 0.01
                ? 'some '
                : utils.formatAmount(Number(linkDetails.tokenAmount)) + ' in ') +
            linkDetails.tokenSymbol +
            '!'
    } catch (e) {
        console.log('error: ', e)
    }

    return {
        title: title,
        icons: {
            icon: '/logo-favicon.png',
        },
        openGraph: {
            images: [
                {
                    url: '/claim-metadata-img.jpg',
                },
            ],
        },
    }
}

export default function ClaimPage() {
    return <components.Claim />
}
