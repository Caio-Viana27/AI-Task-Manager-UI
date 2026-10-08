import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { signUp } from '../api/auth.ts'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/useAuth.ts'
import {
  hasErrors,
  validateSignUp,
  type AuthMessageKey,
  type FieldErrors,
  type SignUpField,
} from '../auth/validation.ts'
import { AuthCard } from '../components/AuthCard.tsx'
import { FormField } from '../components/FormField.tsx'
import { errorKey } from '../i18n/errorKey.ts'

const SIGN_UP_FIELDS: readonly SignUpField[] = ['email', 'name', 'password']

function isSignUpField(field: string): field is SignUpField {
  return (SIGN_UP_FIELDS as readonly string[]).includes(field)
}

/**
 * Maps a failed sign-up to field errors and a form-level error. Server field errors get
 * the localized `fieldErrors.<field>` message, never the server's English text (D5).
 */
function errorsFromApi(error: Error): { fields: FieldErrors<SignUpField>; form: AuthMessageKey | null } {
  if (error instanceof ApiError && error.code === 'EMAIL_ALREADY_USED') {
    return { fields: { email: 'errors:EMAIL_ALREADY_USED' }, form: null }
  }
  if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
    const fields: FieldErrors<SignUpField> = {}
    for (const { field } of error.errors) {
      if (isSignUpField(field)) {
        fields[field] = `fieldErrors.${field}`
      }
    }
    if (hasErrors(fields)) {
      return { fields, form: null }
    }
  }
  return { fields: {}, form: `errors:${errorKey(error)}` }
}

export function SignupPage() {
  const { t } = useTranslation(['auth', 'errors'])
  const { login } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState<Record<SignUpField, string>>({ email: '', name: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<SignUpField>>({})
  const [formError, setFormError] = useState<AuthMessageKey | null>(null)

  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: (response) => {
      login(response)
      void navigate('/', { replace: true })
    },
    onError: (error) => {
      const { fields, form } = errorsFromApi(error)
      setFieldErrors(fields)
      setFormError(form)
    },
  })

  function update(field: SignUpField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const request = { ...values, email: values.email.trim() }
    const errors = validateSignUp(request)
    setFieldErrors(errors)
    setFormError(null)
    if (!hasErrors(errors)) {
      mutation.mutate(request)
    }
  }

  return (
    <AuthCard title={t('signup.title')}>
      {formError && (
        <p role="alert" className="alert-error mt-6">
          {t(formError)}
        </p>
      )}
      <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <FormField
          label={t('fields.email')}
          type="email"
          name="email"
          autoComplete="email"
          placeholder={t('fields.emailPlaceholder')}
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
          error={fieldErrors.email && t(fieldErrors.email)}
        />
        <FormField
          label={t('fields.name')}
          type="text"
          name="name"
          autoComplete="name"
          placeholder={t('fields.namePlaceholder')}
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          error={fieldErrors.name && t(fieldErrors.name)}
        />
        <FormField
          label={t('fields.password')}
          type="password"
          name="password"
          autoComplete="new-password"
          hint={t('fields.passwordHint')}
          value={values.password}
          onChange={(event) => update('password', event.target.value)}
          error={fieldErrors.password && t(fieldErrors.password)}
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn btn-primary mt-2 w-full py-2.5"
        >
          {mutation.isPending ? t('signup.submitting') : t('signup.submit')}
        </button>
      </form>
      <p className="mt-6 border-t border-stone-100 pt-6 text-center text-sm text-stone-600">
        {t('signup.haveAccount')}{' '}
        <Link to="/login" className="link">
          {t('signup.loginLink')}
        </Link>
      </p>
    </AuthCard>
  )
}
