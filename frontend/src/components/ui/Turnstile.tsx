import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export function Turnstile({ onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const { data: config } = useQuery({
    queryKey: ['turnstile-config'],
    queryFn: () => client.get('/auth/turnstile-config').then((r) => r.data),
    staleTime: Infinity,
  });

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || !config?.site_key) return;
    if (widgetIdRef.current) return; // already rendered

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: config.site_key,
      callback: onVerify,
      'expired-callback': onExpire,
      theme: 'light',
      size: 'flexible',
    });
  }, [config?.site_key, onVerify, onExpire]);

  useEffect(() => {
    if (!config?.enabled) {
      // If Turnstile is not configured, auto-verify with empty token
      onVerify('');
      return;
    }

    // Load Turnstile script if not already loaded
    if (!document.getElementById('turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      script.async = true;
      window.onTurnstileLoad = renderWidget;
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [config?.enabled, renderWidget, onVerify]);

  if (!config?.enabled) return null;

  return <div ref={containerRef} className="flex justify-center" />;
}
