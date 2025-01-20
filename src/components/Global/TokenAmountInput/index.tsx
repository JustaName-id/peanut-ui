import * as context from '@/context'
import * as utils from '@/utils'
import { useContext, useEffect, useMemo, useRef } from 'react'
import Icon from '../Icon'

interface TokenAmountInputProps {
    className?: string
    tokenValue: string | undefined
    setTokenValue: (tokenvalue: string | undefined) => void
    onSubmit?: () => void
    maxValue?: string
}

const TokenAmountInput = ({ className, tokenValue, setTokenValue, onSubmit, maxValue }: TokenAmountInputProps) => {
    const { inputDenomination, setInputDenomination, selectedTokenData } = useContext(context.tokenSelectorContext)
    const inputRef = useRef<HTMLInputElement>(null)
    const inputType = useMemo(() => (window.innerWidth < 640 ? 'text' : 'number'), [])

    const onChange = (tokenvalue: string) => {
        setTokenValue(tokenvalue)
    }

    const handleMaxClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation() // Prevent container click handler from firing
        if (maxValue) {
            setInputDenomination('TOKEN')
            setTokenValue(maxValue)
        }
    }

    useEffect(() => {
        if (inputRef.current) {
            if (tokenValue?.length !== 0) {
                inputRef.current.style.width = `${(tokenValue?.length ?? 0) + 1}ch`
            } else {
                inputRef.current.style.width = `4ch`
            }
        }
    }, [tokenValue])

    const parentWidth = useMemo(() => {
        if (inputRef.current && inputRef.current.parentElement) {
            return inputRef.current.parentElement.offsetWidth
        }
        return 'auto'
    }, [])

    const formRef = useRef<HTMLFormElement>(null)

    const handleContainerClick = () => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }

    return (
        <form
            ref={formRef}
            className={`relative cursor-text rounded-none border border-n-1 px-2 py-4 dark:border-white ${className}`}
            action=""
            onClick={handleContainerClick}
        >
            <div className="flex h-14 w-full flex-row items-center justify-center gap-1">
                {selectedTokenData?.price &&
                    (inputDenomination === 'USD' || utils.estimateStableCoin(selectedTokenData.price) ? (
                        <label className={`text-h1 ${tokenValue ? 'text-black' : 'text-gray-2'}`}>$</label>
                    ) : (
                        <label className="sr-only text-h1">$</label>
                    ))}
                <input
                    className={`focus:border-primary-1 dark:focus:border-primary-1 h-12 w-[4ch] max-w-80 bg-transparent text-center text-h1 outline-none transition-colors placeholder:text-h1 dark:border-white dark:bg-n-1 dark:text-white dark:placeholder:text-white/75`}
                    placeholder={'0.00'}
                    onChange={(e) => {
                        const value = utils.formatAmountWithoutComma(e.target.value)
                        onChange(value)
                    }}
                    ref={inputRef}
                    inputMode="decimal"
                    type={inputType}
                    value={tokenValue}
                    step="any"
                    min="0"
                    autoComplete="off"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            if (onSubmit) onSubmit()
                        }
                        if (['e', '+', '-'].includes(e.key.toLowerCase())) {
                            e.preventDefault()
                        }
                    }}
                    style={{ maxWidth: `${parentWidth}px` }}
                />
                {maxValue && maxValue !== tokenValue && (
                    <button
                        onClick={handleMaxClick}
                        className="text-grey-1 absolute right-1 ml-1 px-2 py-1 text-h7 uppercase transition-colors hover:text-black"
                    >
                        Max
                    </button>
                )}
            </div>
            {selectedTokenData?.price && !utils.estimateStableCoin(selectedTokenData.price) && (
                <div className="flex w-full flex-row items-center justify-center gap-1">
                    <label className="text-grey-1 text-base">
                        {!tokenValue
                            ? '0'
                            : inputDenomination === 'USD'
                              ? utils.formatTokenAmount(Number(tokenValue) / (selectedTokenData?.price ?? 0))
                              : '$' + utils.formatTokenAmount(Number(tokenValue) * (selectedTokenData?.price ?? 0))}
                    </label>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            if (selectedTokenData?.price)
                                setInputDenomination(inputDenomination === 'USD' ? 'TOKEN' : 'USD')
                        }}
                    >
                        <Icon name={'switch'} className="fill-grey-1 rotate-90 cursor-pointer" />
                    </button>
                </div>
            )}
        </form>
    )
}

export default TokenAmountInput
