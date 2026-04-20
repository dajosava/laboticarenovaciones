'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { AuthError } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Moon,
  Phone,
  Shield,
  Sparkles,
  Stethoscope,
  Sun,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@/components/layout/ThemeProvider'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const LAST_LOGIN_KEY = 'farmarenovar-last-login-at'
const REMEMBER_KEY = 'farmarenovar-remember-session'

const SOPORTE_DESARROLLADOR = {
  nombre: 'David Salazar Valverde',
  telefono: '50670142848',
  telefonoDisplay: '+506 7014 2848',
  correo: 'dajosava@gmail.com',
} as const

function mapAuthError(error: AuthError | null): string {
  if (!error?.message && !error?.status) {
    return 'Credenciales incorrectas. Revisa tu correo y contraseña.'
  }
  const msg = (error.message || '').toLowerCase()
  const status = (error as AuthError & { status?: number }).status
  if (status === 429 || msg.includes('rate') || msg.includes('too many') || msg.includes('over_request')) {
    return 'Demasiados intentos en poco tiempo. Espera unos minutos e inténtalo de nuevo.'
  }
  return 'Credenciales incorrectas. Revisa tu correo y contraseña.'
}

function FloatingInput(props: {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete: string
  icon: typeof Mail
  error?: string
  disabled?: boolean
}) {
  const { id, label, type, value, onChange, placeholder, autoComplete, icon: Icon, error, disabled } = props
  const [focused, setFocused] = useState(false)
  const hasValue = value.trim().length > 0
  const lifted = focused || hasValue

  return (
    <div>
      <div
        className={cn(
          'relative rounded-xl border bg-white transition-[box-shadow,border-color] dark:bg-slate-950/60',
          error
            ? 'border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
            : 'border-slate-200 shadow-sm dark:border-slate-700 dark:shadow-none',
          !error && 'focus-within:border-brand-500 focus-within:shadow-[0_0_0_4px_rgba(34,162,90,0.18)] dark:focus-within:border-brand-500',
        )}
      >
        <Icon
          className={cn(
            'pointer-events-none absolute left-3.5 z-10 h-5 w-5 text-slate-400 transition-all duration-200 dark:text-slate-500',
            lifted ? 'top-[1.125rem] -translate-y-1/2' : 'top-1/2 -translate-y-1/2',
          )}
          aria-hidden
        />
        <input
          id={id}
          type={type}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn(
            'peer relative z-[2] w-full rounded-xl bg-white pl-11 pr-3 outline-none dark:bg-slate-950',
            'pt-5 pb-2.5 text-[15px] text-slate-900 dark:text-slate-100',
            /* Hint nativo solo con foco y vacío; el label usa estado React (fiable en claro/oscuro) */
            'placeholder:text-transparent focus:placeholder:text-slate-500/90 dark:focus:placeholder:text-slate-400',
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <label
          htmlFor={id}
          className={cn(
            'pointer-events-none absolute left-11 z-[3] origin-left transition-all duration-200',
            lifted
              ? 'top-2 translate-y-0 text-xs font-medium text-brand-600 dark:text-brand-400'
              : 'top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400',
            /* Autofill sin actualizar React aún: sube el label igual */
            'peer-[&:is(:-webkit-autofill)]:top-2 peer-[&:is(:-webkit-autofill)]:translate-y-0 peer-[&:is(:-webkit-autofill)]:text-xs peer-[&:is(:-webkit-autofill)]:font-medium peer-[&:is(:-webkit-autofill)]:text-brand-600 dark:peer-[&:is(:-webkit-autofill)]:text-brand-400',
          )}
        >
          {label}
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [showForgot, setShowForgot] = useState(false)
  const [resetSending, setResetSending] = useState(false)
  const [lastLoginLabel, setLastLoginLabel] = useState<string | null>(null)
  const [modalSoporteAbierto, setModalSoporteAbierto] = useState(false)

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LAST_LOGIN_KEY) : null
    if (!raw) return
    try {
      const d = new Date(raw)
      if (!Number.isNaN(d.getTime())) {
        setLastLoginLabel(format(d, "d MMM yyyy · HH:mm", { locale: es }))
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const remembered = typeof window !== 'undefined' ? localStorage.getItem(REMEMBER_KEY) : null
    if (remembered === '0') setRemember(false)
  }, [])

  useEffect(() => {
    if (searchParams.get('error') === 'auth') {
      toast.error('No pudimos completar el acceso. Vuelve a intentarlo.')
    }
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFieldErrors({})

    const trimmed = email.trim()
    if (!trimmed) {
      setFieldErrors({ email: 'Introduce tu correo institucional.' })
      return
    }
    if (!password) {
      setFieldErrors({ password: 'Introduce tu contraseña.' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: trimmed, password })

    if (error) {
      const msg = mapAuthError(error)
      setFormError(msg)
      toast.error(msg)
      setLoading(false)
      return
    }

    try {
      localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
      localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString())
    } catch {
      /* ignore */
    }

    toast.success('Bienvenido al sistema')
    router.push('/dashboard')
    router.refresh()
  }

  async function handleResetPassword() {
    const trimmed = email.trim()
    if (!trimmed) {
      setFieldErrors({ email: 'Introduce el correo para enviarte el enlace de recuperación.' })
      return
    }
    setResetSending(true)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${origin}/login`,
    })
    setResetSending(false)
    if (error) {
      const msg = mapAuthError(error as AuthError)
      toast.error(msg)
      return
    }
    toast.message('Si el correo está registrado, recibirás instrucciones en breve.')
    setShowForgot(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* LEFT — branding */}
        <div className="relative hidden w-full flex-col justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 p-12 text-white lg:flex lg:w-1/2 lg:p-16">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative z-10 max-w-md">
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                <Stethoscope className="h-9 w-9 text-emerald-300" strokeWidth={1.75} aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Medicamentos · Renovaciones</p>
                <h1 className="text-3xl font-bold tracking-tight">La Botica</h1>
              </div>
            </div>

            <p className="text-lg leading-relaxed text-slate-300">
              Gestión inteligente de tratamientos y renovaciones médicas.
            </p>

            <ul className="mt-10 space-y-3 text-slate-300">
              {[
                'Control de pacientes',
                'Historial de medicamentos',
                'Alertas automáticas',
                'Multi-sucursal',
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-12 flex items-center gap-2 text-sm text-slate-400">
              <Shield className="h-4 w-4 text-emerald-400/90" aria-hidden />
              <span>Infraestructura pensada para cumplimiento y trazabilidad.</span>
            </div>
          </div>
        </div>

        {/* RIGHT — login */}
        <div className="flex w-full flex-1 flex-col bg-white dark:bg-slate-950 lg:w-1/2">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                <Stethoscope className="h-5 w-5" aria-hidden />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">FarmaRenovar</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleTheme()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </header>

          <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-10 lg:px-16 xl:px-20">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 lg:mb-10">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Iniciar sesión</h2>
                {lastLoginLabel ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    <Sparkles className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" aria-hidden />
                    Último acceso: {lastLoginLabel}
                  </p>
                ) : null}
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <FloatingInput
                  id="login-email"
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={(v) => {
                    setEmail(v)
                    setFieldErrors((e) => ({ ...e, email: undefined }))
                  }}
                  placeholder="admin@empresa.com"
                  autoComplete="email"
                  icon={Mail}
                  error={fieldErrors.email}
                  disabled={loading}
                />

                <FloatingInput
                  id="login-password"
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(v) => {
                    setPassword(v)
                    setFieldErrors((e) => ({ ...e, password: undefined }))
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  icon={Lock}
                  error={fieldErrors.password}
                  disabled={loading}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900"
                    />
                    Recordar sesión en este equipo
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot((s) => !s)
                      setFormError(null)
                    }}
                    className="text-left text-sm font-medium text-brand-700 underline-offset-2 hover:underline dark:text-brand-400"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {showForgot ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Te enviaremos un enlace para restablecerla al correo que indiques. Revisa también la carpeta de
                      spam.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resetSending}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 disabled:opacity-50 dark:text-brand-400"
                    >
                      {resetSending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Enviar enlace de recuperación
                    </button>
                  </div>
                ) : null}

                {formError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200" role="alert">
                    {formError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-500 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      Iniciando sesión…
                    </>
                  ) : (
                    <>
                      Iniciar sesión
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-100 pt-6 text-sm dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalSoporteAbierto(true)}
                  className="font-medium text-brand-700 underline-offset-2 hover:underline dark:text-brand-400"
                >
                  Contactar soporte
                </button>
                <span className="hidden text-slate-300 sm:inline" aria-hidden>
                  ·
                </span>

              </div>

              <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-500 dark:text-slate-500">
                <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <span>Conexión segura · Credenciales incorrectas se muestran de forma genérica por seguridad</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {modalSoporteAbierto ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onClick={() => setModalSoporteAbierto(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="soporte-titulo"
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalSoporteAbierto(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <h3 id="soporte-titulo" className="pr-10 text-lg font-bold text-slate-900 dark:text-white">
              Soporte técnico
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Datos de contacto del desarrollador del sistema.
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre</dt>
                <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{SOPORTE_DESARROLLADOR.nombre}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Teléfono</dt>
                <dd className="mt-0.5">
                  <a
                    href={`tel:+${SOPORTE_DESARROLLADOR.telefono}`}
                    className="inline-flex items-center gap-2 font-medium text-brand-700 hover:underline dark:text-brand-400"
                  >
                    <Phone className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    {SOPORTE_DESARROLLADOR.telefonoDisplay}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Correo</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${SOPORTE_DESARROLLADOR.correo}`}
                    className="inline-flex items-center gap-2 break-all font-medium text-brand-700 hover:underline dark:text-brand-400"
                  >
                    <Mail className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    {SOPORTE_DESARROLLADOR.correo}
                  </a>
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModalSoporteAbierto(false)}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="h-10 w-10 animate-spin text-brand-600" aria-label="Cargando" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
