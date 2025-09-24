import React, { useCallback, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import { Label } from '@/components/label/label';
import { Input } from '@/components/input/input';
import { Button } from '@/components/button/button';

type AuthMode = 'signin' | 'signup';

const modeCopy: Record<AuthMode, { title: string; cta: string; hint: string }> =
    {
        signin: {
            title: 'Sign in to continue',
            cta: 'Sign in',
            hint: "Don't have an account?",
        },
        signup: {
            title: 'Create your account',
            cta: 'Sign up',
            hint: 'Already have an account?',
        },
    };

export const EmailAuthForm: React.FC = () => {
    const { supabaseEnabled, signInWithPassword, signUpWithPassword } =
        useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<AuthMode>('signin');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    const { title, cta, hint } = useMemo(() => modeCopy[mode], [mode]);

    const toggleMode = useCallback(() => {
        setMode((previous) => (previous === 'signin' ? 'signup' : 'signin'));
        setError(null);
        setInfoMessage(null);
    }, []);

    const onSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!supabaseEnabled) {
                setError('Supabase is not configured.');
                return;
            }

            setSubmitting(true);
            setError(null);
            setInfoMessage(null);

            const action =
                mode === 'signin' ? signInWithPassword : signUpWithPassword;

            const { error } = await action({ email, password });

            setSubmitting(false);

            if (error) {
                setError(error.message);
                return;
            }

            if (mode === 'signup') {
                setInfoMessage(
                    'Account created. Please check your inbox to confirm your email before signing in.'
                );
            }
        },
        [
            email,
            mode,
            password,
            signInWithPassword,
            signUpWithPassword,
            supabaseEnabled,
        ]
    );

    if (!supabaseEnabled) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Supabase not configured</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>
                        Supabase credentials are missing. Update your
                        environment file with
                        <code className="mx-1 rounded bg-muted px-1 py-0.5 text-muted-foreground">
                            VITE_SUPABASE_URL
                        </code>
                        and
                        <code className="mx-1 rounded bg-muted px-1 py-0.5 text-muted-foreground">
                            VITE_SUPABASE_ANON_KEY
                        </code>
                        to enable authentication and realtime collaboration
                        features.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-2">
                <CardTitle>{title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Use your Supabase credentials to access your diagrams
                    anywhere.
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete={
                                mode === 'signin'
                                    ? 'current-password'
                                    : 'new-password'
                            }
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                            minLength={6}
                        />
                    </div>
                    {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                    ) : null}
                    {infoMessage ? (
                        <p className="text-sm text-muted-foreground">
                            {infoMessage}
                        </p>
                    ) : null}
                    <div className="space-y-2">
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full"
                        >
                            {submitting ? 'Please wait…' : cta}
                        </Button>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <span>{hint}</span>
                            <Button
                                type="button"
                                variant="link"
                                onClick={toggleMode}
                                className="px-1"
                            >
                                {mode === 'signin' ? 'Sign up' : 'Sign in'}
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};
