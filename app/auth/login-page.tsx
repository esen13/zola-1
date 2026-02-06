"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { signInWithGoogle } from "@/lib/api"
import { APP_NAME } from "@/lib/config"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { HeaderGoBack } from "../components/header-go-back"

type LoginMethod = "google" | "email"
type EmailStep = "email" | "otp"

interface LoginFormData {
  email: string
  otp: string
}

export default function LoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<LoginMethod | null>(null)
  const [emailStep, setEmailStep] = useState<EmailStep>("email")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isResendingOTP, setIsResendingOTP] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      otp: "",
    },
  })

  const userEmail = form.watch("email")

  useEffect(() => {
    if (resendTimer <= 0) return

    const timer = setTimeout(() => {
      setResendTimer(resendTimer - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [resendTimer])

  const handleSignInWithGoogle = async () => {
    const supabase = createClient()

    if (!supabase) {
      throw new Error("Supabase is not configured")
    }

    try {
      setIsLoading(true)
      setError(null)

      const data = await signInWithGoogle(supabase)

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err: unknown) {
      console.error("Error signing in with Google:", err)
      setError(
        (err as Error).message ||
          "Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = async (data: LoginFormData) => {
    const supabase = createClient()

    if (!supabase) {
      setError("Supabase не настроен")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: true,
        },
      })

      if (signInError) {
        setError(
          signInError.message || "Не удалось отправить код подтверждения"
        )
        return
      }

      setResendTimer(60)
      setEmailStep("otp")
    } catch (err: unknown) {
      console.error("Error sending OTP:", err)
      setError(
        (err as Error).message ||
          "Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!userEmail) return

    const supabase = createClient()

    if (!supabase) {
      setError("Supabase не настроен")
      return
    }

    try {
      setIsResendingOTP(true)
      setError(null)

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: {
          shouldCreateUser: true,
        },
      })

      if (signInError) {
        setError(signInError.message || "Не удалось отправить код повторно")
        return
      }

      setResendTimer(60)
    } catch (err: unknown) {
      console.error("Error resending OTP:", err)
      setError(
        (err as Error).message ||
          "Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова."
      )
    } finally {
      setIsResendingOTP(false)
    }
  }

  const handleOTPSubmit = async (data: LoginFormData) => {
    const supabase = createClient()

    if (!supabase) {
      setError("Supabase не настроен")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data: verifyData, error: verifyError } =
        await supabase.auth.verifyOtp({
          email: data.email,
          token: data.otp,
          type: "email",
        })

      if (verifyError) {
        setError(verifyError.message || "Неверный код подтверждения")
        return
      }

      if (verifyData?.session) {
        // router.refresh()
        // router.push("/")
        window.location.href = "/"
      }
    } catch (err: unknown) {
      console.error("Error verifying OTP:", err)
      setError(
        (err as Error).message ||
          "Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToMethodSelection = () => {
    setLoginMethod(null)
    setEmailStep("email")
    setError(null)
    setResendTimer(0)
    form.reset()
  }

  const handleBackToEmail = () => {
    setEmailStep("email")
    setError(null)
    setResendTimer(0)
    form.setValue("otp", "")
  }

  return (
    <div className="bg-background flex h-dvh w-full flex-col">
      <HeaderGoBack href="/" />

      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-foreground text-3xl font-medium tracking-tight sm:text-4xl">
              Добро пожаловать в {APP_NAME}
            </h1>
            <p className="text-muted-foreground mt-3">
              Войдите ниже, чтобы получить доступ к функциям сервиса.
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-3">
            {emailStep === "email" ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <CardTitle>Вход через Email</CardTitle>
                      <CardDescription className="mt-2">
                        Введите ваш email адрес для получения кода подтверждения
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={form.handleSubmit(handleEmailSubmit)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email">Адрес электронной почты</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        {...form.register("email", {
                          required: "Email обязателен",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Неверный адрес электронной почты",
                          },
                        })}
                        disabled={isLoading}
                      />
                      {form.formState.errors.email && (
                        <p className="text-destructive text-sm">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Отправка..." : "Отправить код"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={handleBackToEmail}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <div className="flex-1">
                      <CardTitle>Подтвердите вход</CardTitle>
                      <CardDescription className="mt-2">
                        Введите код подтверждения, который мы отправили на ваш
                        email адрес:{" "}
                        <span className="font-medium text-black dark:text-white">
                          {userEmail}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={form.handleSubmit(handleOTPSubmit)}
                    className="space-y-2"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="otp">Код подтверждения</Label>
                      </div>

                      <Controller
                        control={form.control}
                        name="otp"
                        rules={{
                          required: "Код подтверждения обязателен",
                          minLength: {
                            value: 6,
                            message: "Код должен содержать 6 цифр",
                          },
                        }}
                        render={({ field }) => (
                          <InputOTP
                            maxLength={6}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isLoading}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        )}
                      />
                      {form.formState.errors.otp && (
                        <p className="text-destructive text-sm">
                          {form.formState.errors.otp.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={handleResendOTP}
                      disabled={isResendingOTP || isLoading || resendTimer > 0}
                    >
                      <RefreshCw
                        className={`mr-1 size-3 ${
                          isResendingOTP ? "animate-spin" : ""
                        }`}
                      />
                      {resendTimer > 0
                        ? `Отправить код повторно (${resendTimer}с)`
                        : "Отправить код повторно"}
                    </Button>

                    <Button
                      type="submit"
                      className="mt-2 w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Проверка..." : "Подтвердить"}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Link
                    href="mailto:info@airis.one"
                    className="text-muted-foreground text-sm hover:underline"
                  >
                    Проблемы со входом? Свяжитесь с поддержкой
                  </Link>
                </CardFooter>
              </Card>
            )}
            {emailStep !== "otp" && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-2">
                      или
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="w-full text-base sm:text-base"
                  size="lg"
                  onClick={handleSignInWithGoogle}
                  disabled={isLoading}
                >
                  <img
                    src="https://www.google.com/favicon.ico"
                    alt="Google logo"
                    width={20}
                    height={20}
                    className="mr-2 size-4"
                  />
                  <span>
                    {isLoading ? "Подключение..." : "Продолжить с Google"}
                  </span>
                </Button>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="text-muted-foreground py-6 text-center text-sm">
        <p>
          Продолжая, вы соглашаетесь с нашими{" "}
          <Link href="/#" className="text-foreground hover:underline">
            Условиями использования
          </Link>{" "}
          и{" "}
          <Link href="/#" className="text-foreground hover:underline">
            Политикой конфиденциальности
          </Link>
        </p>
      </footer>
    </div>
  )
}
