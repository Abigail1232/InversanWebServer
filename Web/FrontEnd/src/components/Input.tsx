import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  withPasswordToggle?: boolean;
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className = "",
      withPasswordToggle,
      hasError,
      type,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordWithToggle = withPasswordToggle && type === "password";
    const resolvedType = isPasswordWithToggle
      ? showPassword
        ? "text"
        : "password"
      : type;

    return (
      <div className="w-full">
        {label && (
          <label
            className="block"
            style={{
              color: "#333333",
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "8px",
              lineHeight: "1.5",
            }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={resolvedType}
            className={`w-full transition-all duration-200 outline-none  ${className}`}
            style={{
              borderRadius: "10px",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor:
                error || hasError
                  ? "#D61216"
                  : isFocused
                    ? "#027EB1"
                    : "#D1D5DB",
              backgroundColor: "white",
              color: "#1A1A1A",
              fontSize: "14px",
              lineHeight: "normal",

              paddingTop: "16px",
              paddingBottom: "16px",
              paddingLeft: "16px",
              paddingRight: isPasswordWithToggle ? "45px" : "16px",
              height: "48px",
              boxSizing: "border-box",
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {isPasswordWithToggle && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeInvisibleOutlined className="text-lg" />
              ) : (
                <EyeOutlined className="text-lg" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p
            className="mt-2"
            style={{ color: "#D61216", fontSize: "13px", lineHeight: "1.5" }}
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
