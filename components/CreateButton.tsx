"use client"

import { Loader2 } from "lucide-react"
import styles from "./CreateButton.module.css"

interface CreateButtonProps {
  isLoading?: boolean
  onClick: () => void
  disabled?: boolean
}

export function CreateButton({
  isLoading = false,
  onClick,
  disabled = false,
}: CreateButtonProps) {
  return (
    <div className={styles.buttonWrap}>
      <button
        type="button"
        className={styles.button}
        onClick={onClick}
        disabled={disabled || isLoading}
        aria-label={isLoading ? "Creating" : "Ink me up"}
      >
        <div className={styles.wrap}>
          <p>
            {isLoading ? (
              <>
                <Loader2
                  className="h-4 w-4 animate-spin"
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
