"use client"

import { Loader2 } from "lucide-react"
import styles from "./InkMeUpButton.module.css"

interface InkMeUpButtonProps {
  isLoading?: boolean
  onClick: () => void
  disabled?: boolean
}

export function InkMeUpButton({
  isLoading = false,
  onClick,
  disabled = false,
}: InkMeUpButtonProps) {
  return (
    <div className={styles.buttonWrap}>
      <button
        type="button"
        className={styles.button}
        onClick={onClick}
        disabled={disabled || isLoading}
        data-loading={isLoading}
        aria-label={isLoading ? "Creating" : "Ink me up"}
      >
        <div className={styles.wrap}>
          <p>
            {isLoading ? (
              <>
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
                CREATING…
              </>
            ) : (
              <>
                <span aria-hidden="true">✧</span>
                <span aria-hidden="true">✦</span>
                INK ME UP
              </>
            )}
          </p>
        </div>
      </button>
    </div>
  )
}
