import * as React from "react"

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={className}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input } 