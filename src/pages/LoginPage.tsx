import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { signIn } from '../api/auth.ts'
import { useAuth } from '../auth/useAuth.ts'
import { hasErrors, validateSignIn, type FieldErrors, type SignInField } from '../auth/validation.ts'
import { AuthCard } from '../components/AuthCard.tsx'
import { FormField } from '../components/FormField.tsx'
import { errorKey } from '../i18n/errorKey.ts'
import { redirectTarget } from '../routes/redirectTarget.ts'

export function LoginPage() {
  const { t } = useTranslation(['auth', 'errors'])
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const expired = searchParams.get('expired') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<SignInField>>({})

  const mutation = useMutation({
    mutationFn: signIn,
    onSuccess: (response) => {
      login(response)
      void navigate(redirectTarget(location.state), { replace: true })
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = { email: email.trim(), password }
    const errors = validateSignIn(values)
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      mutation.reset()
    } else {
      mutation.mutate(values)
    }
  }

  return (
    <AuthCard title={t('login.title')}>
      {expired && !mutation.isError && (
        <p role="status" className="alert-warning mt-6">
          {t('errors:UNAUTHORIZED')}
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="alert-error mt-6">
          {t(`errors:${errorKey(mutation.error)}`)}
        </p>
      )}
      <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <FormField
          label={t('fields.email')}
          type="email"
          name="email"
          autoComplete="email"
          placeholder={t('fields.emailPlaceholder')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email && t(fieldErrors.email)}
        />
        <FormField
          label={t('fields.password')}
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password && t(fieldErrors.password)}
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn btn-primary mt-2 w-full py-2.5"
        >
          {mutation.isPending ? t('login.submitting') : t('login.submit')}
        </button>
      </form>
      <div className="mt-6 flex flex-col items-center gap-3 border-t border-stone-100 pt-6 text-sm">
        <Link to="/forgot-password" className="link">
          {t('login.forgotPassword')}
        </Link>
        <p className="text-stone-600">
          {t('login.noAccount')}{' '}
          <Link to="/signup" className="link">
            {t('login.signupLink')}
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
